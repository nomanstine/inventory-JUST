package just.inventory.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import just.inventory.backend.dto.RequisitionSuggestionResponse;
import just.inventory.backend.model.Item;
import just.inventory.backend.model.ItemInstance;
import just.inventory.backend.model.ItemRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RequisitionSuggestionService {

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${ai.requisition.enabled:true}")
    private boolean aiEnabled;

    @Value("${ai.requisition.api-url:https://generativelanguage.googleapis.com}")
    private String aiApiUrl;

    @Value("${ai.requisition.api-key:}")
    private String aiApiKey;

    @Value("${ai.requisition.model:gemini-1.5-flash}")
    private String aiModel;

    public RequisitionSuggestionResponse suggest(
            String requestingOfficeName,
            String parentOfficeName,
            String reason,
            List<ItemInstance> availableInstances,
            List<ItemRequest> recentRequests,
            List<Item> catalogItems
    ) {
        if (!aiEnabled || aiApiKey == null || aiApiKey.isBlank()) {
            return buildFallbackSuggestions(availableInstances, recentRequests, catalogItems,
                "AI unavailable; returned deterministic recommendations from request and stock history.");
        }

        String prompt = buildPrompt(requestingOfficeName, parentOfficeName, reason, availableInstances, recentRequests);
        try {
            String modelContent = callChatCompletion(prompt);
            RequisitionSuggestionResponse aiResponse = normalizeSuggestions(modelContent, catalogItems);
            if (aiResponse.getSuggestions() == null || aiResponse.getSuggestions().isEmpty()) {
                return buildFallbackSuggestions(availableInstances, recentRequests, catalogItems,
                    "AI returned no catalog matches; using deterministic fallback recommendations.");
            }
            return aiResponse;
        } catch (ResponseStatusException e) {
            if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS || e.getStatusCode() == HttpStatus.BAD_GATEWAY
                || e.getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE || e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                return buildFallbackSuggestions(availableInstances, recentRequests, catalogItems,
                    "AI service issue (" + e.getStatusCode() + "); using deterministic fallback recommendations.");
            }
            throw e;
        }
    }

    private String callChatCompletion(String prompt) {
        try {
            // Gemini API JSON Structure
            Map<String, Object> textPart = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(textPart));
            
            // Constrain output to JSON mode
            Map<String, Object> generationConfig = Map.of(
                    "temperature", 0.2,
                    "response_mime_type", "application/json"
            );

            Map<String, Object> body = Map.of(
                    "contents", List.of(content),
                    "generationConfig", generationConfig
            );

            String payload = objectMapper.writeValueAsString(body);

            // Gemini URL format: {base}/v1beta/models/{model}:generateContent
            String fullUrl = String.format("%s/v1beta/models/%s:generateContent", aiApiUrl, aiModel);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(fullUrl))
                    .header("Content-Type", "application/json")
                    // Gemini uses x-goog-api-key instead of Authorization Bearer
                    .header("x-goog-api-key", aiApiKey)
                    .timeout(Duration.ofSeconds(35))
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                String providerMessage = extractProviderErrorMessage(response.body());
                throw new ResponseStatusException(HttpStatus.valueOf(response.statusCode()), providerMessage);
            }

            JsonNode root = objectMapper.readTree(response.body());
            
            // Extract text from Gemini structure: candidates[0].content.parts[0].text
            JsonNode candidate = root.path("candidates").get(0);
            if (candidate == null || candidate.path("content").path("parts").isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI returned no content");
            }

            String content = candidate.path("content").path("parts").get(0).path("text").asText("");
            if (content.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI API returned empty content");
            }
            return content;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to fetch AI suggestions", e);
        }
    }

    private String buildPrompt(
            String requestingOfficeName,
            String parentOfficeName,
            String reason,
            List<ItemInstance> availableInstances,
            List<ItemRequest> recentRequests
    ) {
        Map<String, Long> availableByItem = availableInstances.stream()
                .filter(i -> i.getStatus() == ItemInstance.ItemStatus.AVAILABLE)
                .collect(Collectors.groupingBy(i -> i.getItem().getName(), Collectors.counting()));

        String availableLines = availableByItem.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .limit(40)
                .map(e -> "- " + e.getKey() + " => " + e.getValue() + " available")
                .collect(Collectors.joining("\n"));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        String recentRequestLines = recentRequests.stream()
                .sorted(Comparator.comparing(ItemRequest::getRequestedDate).reversed())
                .limit(15)
                .map(r -> String.format(Locale.ROOT, "- %s | item=%s | requested=%.0f | reason=%s",
                        r.getRequestedDate() == null ? "unknown" : r.getRequestedDate().format(formatter),
                        r.getItem().getName(), r.getRequestedQuantity(), 
                        Optional.ofNullable(r.getReason()).orElse("")))
                .collect(Collectors.joining("\n"));

        return """
                You are an inventory requisition planner. 
                Generate a list of recommended items for an office transfer.

                Context:
                - Requesting office: %s
                - Source office: %s
                - User note/reason: %s

                Source office available stock:
                %s

                Recent request history:
                %s

                Rules:
                - Suggest up to 5 items.
                - Use only item names found in the stock list.
                - Quantities must be positive integers.
                
                Return ONLY valid JSON in this format:
                {
                  "summary": "short sentence",
                  "suggestions": [
                    { "itemName": "Item Name", "quantity": 1, "rationale": "short reason" }
                  ]
                }
                """.formatted(
                requestingOfficeName, parentOfficeName,
                reason == null || reason.isBlank() ? "(not provided)" : reason,
                availableLines, recentRequestLines
        );
    }

    private RequisitionSuggestionResponse normalizeSuggestions(String modelContent, List<Item> catalogItems) {
        try {
            JsonNode root = objectMapper.readTree(extractJson(modelContent));
            Map<String, Item> itemByName = catalogItems.stream()
                    .collect(Collectors.toMap(i -> i.getName().toLowerCase().trim(), i -> i, (a, b) -> a));

            List<RequisitionSuggestionResponse.SuggestionLine> lines = new ArrayList<>();
            for (JsonNode n : root.path("suggestions")) {
                String itemName = n.path("itemName").asText("").trim();
                int qty = n.path("quantity").asInt(0);
                Item matched = itemByName.get(itemName.toLowerCase());

                if (matched != null && qty > 0) {
                    RequisitionSuggestionResponse.SuggestionLine line = new RequisitionSuggestionResponse.SuggestionLine();
                    line.setItemId(matched.getId());
                    line.setItemName(matched.getName());
                    line.setQuantity(qty);
                    line.setRationale(n.path("rationale").asText(""));
                    lines.add(line);
                }
            }

            RequisitionSuggestionResponse response = new RequisitionSuggestionResponse();
            response.setSummary(root.path("summary").asText("AI-generated suggestions"));
            response.setSource("ai-api");
            response.setSuggestions(lines);
            return response;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to parse AI response", e);
        }
    }

    private String extractJson(String text) {
        String trimmed = text.trim();
        if (trimmed.contains("```json")) {
            trimmed = trimmed.substring(trimmed.indexOf("```json") + 7);
            trimmed = trimmed.substring(0, trimmed.lastIndexOf("```"));
        } else if (trimmed.contains("```")) {
            trimmed = trimmed.substring(trimmed.indexOf("```") + 3);
            trimmed = trimmed.substring(0, trimmed.lastIndexOf("```"));
        }
        return trimmed.trim();
    }

    private String extractProviderErrorMessage(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            return root.path("error").path("message").asText(responseBody);
        } catch (Exception e) {
            return responseBody;
        }
    }

    private RequisitionSuggestionResponse buildFallbackSuggestions(
            List<ItemInstance> availableInstances,
            List<ItemRequest> recentRequests,
            List<Item> catalogItems,
            String warning
    ) {
        Map<Long, Long> availableCountByItemId = availableInstances.stream()
            .filter(instance -> instance.getItem() != null)
            .filter(instance -> instance.getStatus() == ItemInstance.ItemStatus.AVAILABLE)
            .collect(Collectors.groupingBy(instance -> instance.getItem().getId(), Collectors.counting()));

        Map<Long, Double> requestedQuantityByItemId = recentRequests.stream()
            .filter(request -> request.getItem() != null)
            .collect(Collectors.groupingBy(
                request -> request.getItem().getId(),
                Collectors.summingDouble(ItemRequest::getRequestedQuantity)
            ));

        Map<Long, Long> requestCountByItemId = recentRequests.stream()
            .filter(request -> request.getItem() != null)
            .collect(Collectors.groupingBy(
                request -> request.getItem().getId(),
                Collectors.counting()
            ));

        Map<Long, Item> catalogById = catalogItems.stream()
            .collect(Collectors.toMap(Item::getId, item -> item, (a, b) -> a));

        List<RequisitionSuggestionResponse.SuggestionLine> suggestions = requestedQuantityByItemId.entrySet().stream()
            .filter(entry -> availableCountByItemId.getOrDefault(entry.getKey(), 0L) > 0)
            .map(entry -> {
                Long itemId = entry.getKey();
                Item item = catalogById.get(itemId);
                if (item == null) return null;

                long requestCount = requestCountByItemId.getOrDefault(itemId, 0L);
                int quantity = (int) Math.max(1, Math.round(entry.getValue() / Math.max(1L, requestCount)));

                RequisitionSuggestionResponse.SuggestionLine line = new RequisitionSuggestionResponse.SuggestionLine();
                line.setItemId(itemId);
                line.setItemName(item.getName());
                line.setQuantity(quantity);
                line.setRationale("Based on recent request average and available stock.");
                return line;
            })
            .filter(Objects::nonNull)
            .sorted(Comparator.comparingInt(RequisitionSuggestionResponse.SuggestionLine::getQuantity).reversed())
            .limit(5)
            .toList();

        if (suggestions.isEmpty()) {
            suggestions = availableCountByItemId.entrySet().stream()
                .limit(5)
                .map(entry -> {
                    Item item = catalogById.get(entry.getKey());
                    if (item == null) return null;
                    RequisitionSuggestionResponse.SuggestionLine line = new RequisitionSuggestionResponse.SuggestionLine();
                    line.setItemId(entry.getKey());
                    line.setItemName(item.getName());
                    line.setQuantity(1);
                    line.setRationale("Suggested from currently available stock.");
                    return line;
                })
                .filter(Objects::nonNull)
                .toList();
        }

        RequisitionSuggestionResponse response = new RequisitionSuggestionResponse();
        response.setSummary("Recommendations generated from available stock and demand history.");
        response.setSource("fallback");
        response.setWarning(warning);
        response.setSuggestions(suggestions);
        return response;
    }
}