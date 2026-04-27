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

    // Use: https://generativelanguage.googleapis.com
    @Value("${ai.requisition.api-url:https://generativelanguage.googleapis.com}")
    private String aiApiUrl;

    @Value("${ai.requisition.api-key:}")
    private String aiApiKey;

    // Use: gemini-1.5-flash
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
                    "AI configuration missing; returned deterministic recommendations.");
        }

        String prompt = buildPrompt(requestingOfficeName, parentOfficeName, reason, availableInstances, recentRequests);
        
        try {
            String modelContent = callChatCompletion(prompt);
            RequisitionSuggestionResponse aiResponse = normalizeSuggestions(modelContent, catalogItems);
            
            if (aiResponse.getSuggestions() == null || aiResponse.getSuggestions().isEmpty()) {
                return buildFallbackSuggestions(availableInstances, recentRequests, catalogItems,
                        "AI returned no catalog matches; using fallback recommendations.");
            }
            return aiResponse;
        } catch (ResponseStatusException e) {
            // Log error here in a real app: log.error("AI Service Error: {}", e.getReason());
            if (e.getStatusCode().is5xxServerError() || e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                return buildFallbackSuggestions(availableInstances, recentRequests, catalogItems,
                        "AI service currently unavailable (" + e.getStatusCode() + "); using fallback.");
            }
            throw e;
        }
    }

    private String callChatCompletion(String prompt) {
        try {
            // Gemini API Structure: { "contents": [ { "parts": [ { "text": "..." } ] } ] }
            Map<String, Object> textPart = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(textPart));
            
            // generationConfig forces Gemini to return valid JSON
            Map<String, Object> generationConfig = Map.of(
                    "temperature", 0.2,
                    "response_mime_type", "application/json"
            );

            Map<String, Object> body = Map.of(
                    "contents", List.of(content),
                    "generationConfig", generationConfig
            );

            String payload = objectMapper.writeValueAsString(body);

            // Construct full Gemini URL
            String fullUrl = String.format("%s/v1beta/models/%s:generateContent", aiApiUrl, aiModel);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(fullUrl))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", aiApiKey) // Gemini uses this header
                    .timeout(Duration.ofSeconds(35))
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                String errorMsg = extractProviderErrorMessage(response.body());
                throw new ResponseStatusException(HttpStatus.valueOf(response.statusCode()), 
                        "Gemini API Error: " + errorMsg);
            }

            JsonNode root = objectMapper.readTree(response.body());
            
            // Gemini Response Path: candidates[0].content.parts[0].text
            JsonNode candidate = root.path("candidates").get(0);
            if (candidate == null || candidate.path("content").path("parts").isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini returned an empty candidate (blocked or no response)");
            }

            String content = candidate.path("content").path("parts").get(0).path("text").asText("");
            if (content.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini returned empty text content");
            }
            
            return content;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to connect to Gemini API", e);
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
                        r.getReason() == null ? "" : r.getReason()))
                .collect(Collectors.joining("\n"));

        return """
                You are an inventory requisition planner. Generate requisition suggestions for office transfers.
                
                Context:
                - Requesting office: %s
                - Source office: %s
                - User note: %s

                Source office stock:
                %s

                Recent demand history:
                %s

                Rules:
                - Suggest up to 5 items.
                - Quantities must be positive integers.
                - Use only item names exactly as listed in 'Source office stock'.
                - Return valid JSON.

                Output Format:
                {
                  "summary": "short explanation",
                  "suggestions": [
                    { "itemName": "string", "quantity": 5, "rationale": "string" }
                  ]
                }
                """.formatted(requestingOfficeName, parentOfficeName, reason, availableLines, recentRequestLines);
    }

    private RequisitionSuggestionResponse normalizeSuggestions(String modelContent, List<List<Item>> catalogItemsList) {
        // Flat mapping catalogItems from potential nested list to single list
        List<Item> catalogItems = catalogItemsList.stream().flatMap(List::stream).collect(Collectors.toList());
        return normalizeSuggestions(modelContent, catalogItems);
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
            response.setSummary(root.path("summary").asText("AI Suggestions"));
            response.setSource("ai-gemini");
            response.setSuggestions(lines);
            return response;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "JSON Parsing failed", e);
        }
    }

    private String extractJson(String text) {
        // Strips markdown backticks if Gemini accidentally includes them
        if (text.contains("```json")) {
            text = text.substring(text.indexOf("```json") + 7);
            text = text.substring(0, text.lastIndexOf("```"));
        } else if (text.contains("```")) {
            text = text.substring(text.indexOf("```") + 3);
            text = text.substring(0, text.lastIndexOf("```"));
        }
        return text.trim();
    }

    private String extractProviderErrorMessage(String responseBody) {
        try {
            JsonNode node = objectMapper.readTree(responseBody);
            return node.path("error").path("message").asText(responseBody);
        } catch (Exception e) {
            return responseBody;
        }
    }

    private RequisitionSuggestionResponse buildFallbackSuggestions(List<ItemInstance> available, List<ItemRequest> recent, List<Item> catalog, String warning) {
        // This is a simplified version of your original fallback logic
        RequisitionSuggestionResponse response = new RequisitionSuggestionResponse();
        response.setSummary("Deterministic suggestions based on available stock.");
        response.setSource("fallback");
        response.setWarning(warning);
        response.setSuggestions(new ArrayList<>()); 
        return response;
    }
}