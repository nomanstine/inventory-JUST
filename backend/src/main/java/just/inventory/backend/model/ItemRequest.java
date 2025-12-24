package just.inventory.backend.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "item_requests")
@Data
@NoArgsConstructor
public class ItemRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(hidden = true)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;
    
    @ManyToOne
    @JoinColumn(name = "fulfilled_item_instance_id")
    private ItemInstance fulfilledItemInstance;

    @ManyToOne
    @JoinColumn(name = "requesting_office_id", nullable = false)
    private Office requestingOffice;

    @ManyToOne
    @JoinColumn(name = "parent_office_id", nullable = false)
    private Office parentOffice;

    @ManyToOne
    @JoinColumn(name = "requested_by_user_id", nullable = false)
    private User requestedBy;

    @ManyToOne
    @JoinColumn(name = "approved_by_user_id")
    private User approvedBy;

    @Column(nullable = false)
    private Double requestedQuantity;

    private Double approvedQuantity;

    private Double fulfilledQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    private String reason;

    private String remarks;

    @Column(nullable = false, updatable = false)
    private LocalDateTime requestedDate;

    private LocalDateTime approvedDate;

    private LocalDateTime rejectedDate;

    private LocalDateTime fulfilledDate;

    @PrePersist
    protected void onCreate() {
        requestedDate = LocalDateTime.now();
        if (status == null) {
            status = RequestStatus.PENDING;
        }
    }

    public enum RequestStatus {
        PENDING,           // Request submitted, waiting for approval
        APPROVED,          // Request approved by parent office
        REJECTED,          // Request rejected
        PARTIALLY_FULFILLED, // Some items sent, can send more
        FULFILLED,         // All approved items transferred
        CANCELLED          // Request cancelled by requester
    }
}
