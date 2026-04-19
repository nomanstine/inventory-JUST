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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RequisitionSuggestionService {

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${ai.requisition.enabled:true}")
    private boolean aiEnabled;

    @Value("${ai.requisition.api-url:https://api.openai.com/v1/chat/completions}")
    private String aiApiUrl;

    @Value("${ai.requisition.api-key:}")
    private String aiApiKey;

    @Value("${ai.requisition.model:gpt-4o-mini}")
    private String aiModel;

    public RequisitionSuggestionResponse suggest(
            String requestingOfficeName,
            String parentOfficeName,
            String reason,
            List<ItemInstance> availableInstances,
            List<ItemRequest> recentRequests,
            List<Item> catalogItems
    ) {
        if (!aiEnabled) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI suggestion is currently disabled");
        }
        if (aiApiKey == null || aiApiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI API key is not configured. Set ai.requisition.api-key or AI_REQUISITION_API_KEY");
        }

        String prompt = buildPrompt(requestingOfficeName, parentOfficeName, reason, availableInstances, recentRequests);
        String modelContent = callChatCompletion(prompt);
        return normalizeSuggestions(modelContent, catalogItems);
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

        List<Map.Entry<String, Long>> topAvailable = availableByItem.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .limit(40)
                .toList();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        String recentRequestLines = recentRequests.stream()
                .sorted(Comparator.comparing(ItemRequest::getRequestedDate).reversed())
                .limit(15)
                .map(r -> {
                    String requestedDate = r.getRequestedDate() == null
                            ? "unknown-date"
                            : r.getRequestedDate().format(formatter);
                    return String.format(Locale.ROOT,
                            "- %s | item=%s | requested=%.0f | approved=%s | status=%s | reason=%s",
                            requestedDate,
                            r.getItem().getName(),
                            r.getRequestedQuantity(),
                            r.getApprovedQuantity() == null ? "n/a" : String.format(Locale.ROOT, "%.0f", r.getApprovedQuantity()),
                            r.getStatus().name(),
                            Optional.ofNullable(r.getReason()).orElse(""));
                })
                .collect(Collectors.joining("\n"));

        String availableLines = topAvailable.stream()
                .map(e -> "- " + e.getKey() + " => " + e.getValue() + " available")
                .collect(Collectors.joining("\n"));

        return """
                You are an inventory requisition planner.
                Generate practical requisition suggestions for office transfers.

                Context:
                - Requesting office: %s
                - Source office: %s
                - User note/reason: %s

                Source office currently available stock (top items):
                %s

                Recent requisitions from requesting office:
                %s

                Rules:
                - Suggest up to 5 items.
                - Quantities must be positive integers.
                - Use only item names found in stock list.
                - Prioritize items that seem repeatedly requested or aligned with the reason.
                - Keep rationale short and practical.

                Return STRICT JSON only with this shape:
                {
                  "summary": "one short sentence",
                  "suggestions": [
                    {
                      "itemName": "string",
                      "quantity": 1,
                      "rationale": "string"
                    }
                  ]
                }
                """.formatted(
                requestingOfficeName,
                parentOfficeName,
                reason == null || reason.isBlank() ? "(not provided)" : reason,
                availableLines.isBlank() ? "- no available stock records" : availableLines,
                recentRequestLines.isBlank() ? "- no recent requests" : recentRequestLines
        );
    }

    private String callChatCompletion(String prompt) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", aiModel);
            body.put("temperature", 0.2);
            body.put("messages", List.of(
                    Map.of("role", "system", "content", "You return only valid JSON."),
                    Map.of("role", "user", "content", prompt)
            ));

            String payload = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(aiApiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + aiApiKey)
                    .timeout(Duration.ofSeconds(35))
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "AI API error: " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
            String content = contentNode.asText("");
            if (content.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "AI API returned empty content");
            }
            return content;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to fetch AI suggestions", e);
        }
    }

    private RequisitionSuggestionResponse normalizeSuggestions(String modelContent, List<Item> catalogItems) {
        try {
            String jsonText = extractJson(modelContent);
            JsonNode root = objectMapper.readTree(jsonText);

            Map<String, Item> itemByName = catalogItems.stream()
                    .collect(Collectors.toMap(
                            i -> i.getName().toLowerCase(Locale.ROOT).trim(),
                            i -> i,
                            (a, b) -> a,
                            LinkedHashMap::new
                    ));

            List<RequisitionSuggestionResponse.SuggestionLine> lines = new ArrayList<>();
            for (JsonNode n : root.path("suggestions")) {
                String itemName = n.path("itemName").asText("").trim();
                int quantity = Math.max(0, n.path("quantity").asInt(0));
                if (itemName.isBlank() || quantity <= 0) {
                    continue;
                }
                Item matched = itemByName.get(itemName.toLowerCase(Locale.ROOT));
                if (matched == null) {
                    continue;
                }

                RequisitionSuggestionResponse.SuggestionLine line = new RequisitionSuggestionResponse.SuggestionLine();
                line.setItemId(matched.getId());
                line.setItemName(matched.getName());
                line.setQuantity(quantity);
                line.setRationale(n.path("rationale").asText(""));
                lines.add(line);
            }

            RequisitionSuggestionResponse response = new RequisitionSuggestionResponse();
            response.setSummary(root.path("summary").asText("AI-generated requisition suggestions"));
            response.setSource("ai-api");
            response.setSuggestions(lines.stream().limit(5).toList());
            if (response.getSuggestions().isEmpty()) {
                response.setWarning("AI returned no valid item matches from current catalog");
            }
            return response;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to parse AI suggestion response", e);
        }
    }

    private String extractJson(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
            int firstNewLine = trimmed.indexOf('\n');
            if (firstNewLine >= 0) {
                trimmed = trimmed.substring(firstNewLine + 1, trimmed.length() - 3).trim();
            }
        }

        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }
        return trimmed;
    }
}