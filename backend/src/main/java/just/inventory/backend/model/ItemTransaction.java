package just.inventory.backend.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "item_transactions")
@Data
@NoArgsConstructor
public class ItemTransaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(hidden = true)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "item_instance_id", nullable = false)
    private ItemInstance itemInstance;

    @ManyToOne
    @JoinColumn(name = "from_office_id")
    private Office fromOffice;

    @ManyToOne
    @JoinColumn(name = "to_office_id")
    private Office toOffice;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;

    @Column(nullable = false)
    private Double quantity;

    private String remarks;

    @ManyToOne
    @JoinColumn(name = "confirmed_by_user_id")
    private User confirmedBy;

    private LocalDateTime confirmedDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime transactionDate;

    @PrePersist
    protected void onCreate() {
        transactionDate = LocalDateTime.now();
        if (status == null) {
            status = TransactionStatus.PENDING;
        }
    }

    public enum TransactionType {
        PURCHASE,      // New item purchased
        DISTRIBUTION,  // Distributed to user/department
        TRANSFER,      // Transferred between offices
        RETURN,        // Returned to inventory
        DAMAGED,       // Marked as damaged
        LOST,          // Marked as lost
        DISPOSED       // Disposed/scrapped
    }

    public enum TransactionStatus {
        PENDING,       // Awaiting confirmation from receiving office
        CONFIRMED,     // Confirmed and completed
        REJECTED,      // Rejected by receiving office
        CANCELLED      // Cancelled by sending office
    }
}
