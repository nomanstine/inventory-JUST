package just.inventory.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class RequisitionSuggestionResponse {
    private String summary;
    private String source;
    private String warning;
    private List<SuggestionLine> suggestions;

    @Data
    public static class SuggestionLine {
        private Long itemId;
        private String itemName;
        private Integer quantity;
        private String rationale;
    }
}