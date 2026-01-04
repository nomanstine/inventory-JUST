package just.inventory.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PurchaseResponse {
    private Long id;
    private String supplier;
    private String invoiceNumber;
    private String remarks;
    private String receiptUrl;
    private LocalDateTime purchasedDate;
    private UserSummary purchasedBy;
    private OfficeSummary office;
    private List<PurchaseItemResponse> items;
    private Double totalAmount;
    private Integer totalItems;
    
    @Data
    public static class UserSummary {
        private Long id;
        private String username;
        private String name;
        private String fullName;
    }
    
    @Data
    public static class OfficeSummary {
        private Long id;
        private String name;
    }
    
    @Data
    public static class PurchaseItemResponse {
        private Long id;
        private ItemSummary item;
        private Double quantity;
        private Double unitPrice;
        private Double totalPrice;
        private List<Long> itemInstanceIds; // IDs of created item instances
        private List<String> itemBarcodes;  // Barcodes of created item instances
    }
    
    @Data
    public static class ItemSummary {
        private Long id;
        private String name;
    }
}
