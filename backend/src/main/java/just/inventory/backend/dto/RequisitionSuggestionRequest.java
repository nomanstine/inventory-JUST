package just.inventory.backend.dto;

import lombok.Data;

@Data
public class RequisitionSuggestionRequest {
    private Long parentOfficeId;
    private String reason;
}