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

    /**
     * Gemini REST endpoint — the API key is appended as a query parameter.
     * Default model: gemini-2.0-flash (fast and cost-effective).
     * Override via application.properties: ai.requisition.model=gemini-1.5-pro
     */
    @Value("${ai.requisition.model:gemini-2.0-flash}")
    private String aiModel;

    /**
     * Injected from the secret stored in the environment / secret manager.
     * In Spring Boot, expose the secret as the env-var GEMINI_API_KEY and add
     *   ai.requisition.api-key=${GEMINI_API_KEY}
     * to application.properties (or application.yml).
     */
    @Value("${ai.requisition.api-key:}")
    private String geminiApiKey;

    // -----------------------------------------------------------------------
    // Public entry point
    // -----------------------------------------------------------------------

    public RequisitionSuggestionResponse suggest(
            String requestingOfficeName,
            String parentOfficeName,
            String reason,
            List<ItemInstance> availableInstances,
            List<ItemRequest> recentRequests,
            List<Item> catalogItems
    ) {
        if (!aiEnabled || geminiApiKey == null || geminiApiKey.isBlank()) {
            return buildFallbackSuggestions(availableInstances, recentRequests, catalogItems,
                    "AI unavailable; returned deterministic recommendations from request and stock history.");
        }

        String prompt = buildPrompt(requestingOfficeName, parentOfficeName, reason,
                availableInstances, recentRequests);
        try {
            String modelContent = callGemini(prompt);
            RequisitionSuggestionResponse aiResponse = normalizeSuggestions(modelContent, catalogItems);
            if (aiResponse.getSuggestions() == null || aiResponse.getSuggestions().isEmpty()) {
                return buildFallbackSuggestions(availableInstances, recentRequests, catalogItems,
                        "AI returned no catalog matches; using deterministic fallback recommendations.");
            }
            return aiResponse;
        } catch (ResponseStatusException e) {
            if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS
                    || e.getStatusCode() == HttpStatus.BAD_GATEWAY
                    || e.getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE) {
                return buildFallbackSuggestions(availableInstances, recentRequests, catalogItems,
                        "AI service unavailable; using deterministic fallback recommendations.");
            }
            throw e;
        }
    }

    // -----------------------------------------------------------------------
    // Fallback (deterministic)
    // -----------------------------------------------------------------------

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
                    double totalRequested = entry.getValue();
                    int quantity = (int) Math.max(1, Math.round(totalRequested / Math.max(1L, requestCount)));

                    RequisitionSuggestionResponse.SuggestionLine line = new RequisitionSuggestionResponse.SuggestionLine();
                    line.setItemId(itemId);
                    line.setItemName(item.getName());
                    line.setQuantity(quantity);
                    line.setRationale("Requested " + requestCount + " times recently; suggested from average demand and available stock.");
                    return line;
                })
                .filter(line -> line != null)
                .sorted(Comparator.comparingInt(RequisitionSuggestionResponse.SuggestionLine::getQuantity).reversed())
                .limit(5)
                .toList();

        if (suggestions.isEmpty()) {
            suggestions = availableCountByItemId.entrySet().stream()
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
                    .filter(line -> line != null)
                    .limit(5)
                    .toList();
        }

        RequisitionSuggestionResponse response = new RequisitionSuggestionResponse();
        response.setSummary("Recommendations generated from recent demand and available stock.");
        response.setSource("fallback");
        response.setWarning(warning);
        response.setSuggestions(suggestions);
        return response;
    }

    // -----------------------------------------------------------------------
    // Prompt builder (unchanged logic, same output)
    // -----------------------------------------------------------------------

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

                Return STRICT JSON only — no markdown, no code fences — with this shape:
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

    // -----------------------------------------------------------------------
    // Gemini REST call
    // Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
    // -----------------------------------------------------------------------

    private String callGemini(String prompt) {
        try {
            /*
             * Gemini request body:
             * {
             *   "system_instruction": { "parts": [{ "text": "..." }] },
             *   "contents": [{ "parts": [{ "text": "..." }] }],
             *   "generationConfig": { "temperature": 0.2, "responseMimeType": "application/json" }
             * }
             *
             * responseMimeType = "application/json" tells Gemini to return pure JSON —
             * no markdown fences. Supported on gemini-1.5-* and gemini-2.0-*.
             */
            Map<String, Object> systemInstruction = Map.of(
                    "parts", List.of(Map.of("text", "You return only valid JSON. Do not wrap output in markdown code fences."))
            );

            Map<String, Object> userContent = Map.of(
                    "parts", List.of(Map.of("text", prompt))
            );

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.2);
            generationConfig.put("responseMimeType", "application/json");

            Map<String, Object> body = new HashMap<>();
            body.put("system_instruction", systemInstruction);
            body.put("contents", List.of(userContent));
            body.put("generationConfig", generationConfig);

            String payload = objectMapper.writeValueAsString(body);

            String url = String.format(
                    "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    aiModel, geminiApiKey
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(35))
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                String providerMessage = extractProviderErrorMessage(response.body());
                String reason = "Gemini API error " + response.statusCode();
                if (!providerMessage.isBlank()) {
                    reason += ": " + providerMessage;
                }

                // 429 → quota / rate limit
                if (response.statusCode() == 429) {
                    throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, reason);
                }

                // 400 with INVALID_API_KEY or similar → treat as service-unavailable so fallback kicks in
                if (response.statusCode() == 400 || response.statusCode() == 403) {
                    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                            "Gemini API key or request invalid (" + response.statusCode() + "). " + providerMessage);
                }

                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, reason);
            }

            /*
             * Gemini success response shape:
             * {
             *   "candidates": [{
             *     "content": {
             *       "parts": [{ "text": "..." }]
             *     }
             *   }]
             * }
             */
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode textNode = root
                    .path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text");

            String content = textNode.asText("").trim();
            if (content.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Gemini returned empty content");
            }
            return content;

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to fetch Gemini suggestions", e);
        }
    }

    // -----------------------------------------------------------------------
    // Error message extractor (handles Gemini error envelope too)
    // -----------------------------------------------------------------------

    private String extractProviderErrorMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) return "";
        try {
            JsonNode root = objectMapper.readTree(responseBody);

            // Gemini error shape: { "error": { "message": "..." } }
            String message = root.path("error").path("message").asText("").trim();
            if (!message.isBlank()) return message;

            message = root.path("message").asText("").trim();
            if (!message.isBlank()) return message;
        } catch (Exception ignored) {
            // fall through to raw snippet
        }
        String compact = responseBody.replaceAll("\\s+", " ").trim();
        return compact.length() > 200 ? compact.substring(0, 200) + "..." : compact;
    }

    // -----------------------------------------------------------------------
    // Response normalizer (unchanged logic)
    // -----------------------------------------------------------------------

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
                if (itemName.isBlank() || quantity <= 0) continue;

                Item matched = itemByName.get(itemName.toLowerCase(Locale.ROOT));
                if (matched == null) continue;

                RequisitionSuggestionResponse.SuggestionLine line = new RequisitionSuggestionResponse.SuggestionLine();
                line.setItemId(matched.getId());
                line.setItemName(matched.getName());
                line.setQuantity(quantity);
                line.setRationale(n.path("rationale").asText(""));
                lines.add(line);
            }

            RequisitionSuggestionResponse response = new RequisitionSuggestionResponse();
            response.setSummary(root.path("summary").asText("AI-generated requisition suggestions"));
            response.setSource("gemini");
            response.setSuggestions(lines.stream().limit(5).toList());
            if (response.getSuggestions().isEmpty()) {
                response.setWarning("Gemini returned no valid item matches from current catalog");
            }
            return response;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to parse Gemini suggestion response", e);
        }
    }

    private String extractJson(String text) {
        String trimmed = text.trim();
        // Strip markdown code fences if model ignores the responseMimeType hint
        if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
            int firstNewLine = trimmed.indexOf('\n');
            if (firstNewLine >= 0) {
                trimmed = trimmed.substring(firstNewLine + 1, trimmed.length() - 3).trim();
            }
        }
        int firstBrace = trimmed.indexOf('{');
        int lastBrace  = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }
        return trimmed;
    }
}