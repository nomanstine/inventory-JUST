package just.inventory.backend.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchases")
@Data
@NoArgsConstructor
public class Purchase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(hidden = true)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;
    
    @Column(nullable = false)
    private Double quantity;

    @ManyToOne
    @JoinColumn(name = "purchased_by_user_id", nullable = false)
    private User purchasedBy;

    @ManyToOne
    @JoinColumn(name = "office_id", nullable = false)
    private Office office;

    @Column(nullable = false)
    private Double unitPrice;

    private String supplier;

    private String remarks;

    @Column(length = 500)
    private String receiptUrl;

    @Column(nullable = false, updatable = false)
    private LocalDateTime purchasedDate;

    @PrePersist
    protected void onCreate() {
        purchasedDate = LocalDateTime.now();
    }
}