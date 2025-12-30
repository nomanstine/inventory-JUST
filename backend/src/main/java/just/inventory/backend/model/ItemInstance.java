package just.inventory.backend.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "item_instances")
@Data
@NoArgsConstructor
public class ItemInstance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(hidden = true)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(nullable = false, unique = true)
    private String barcode;

    @ManyToOne
    @JoinColumn(name = "inventory_id", nullable = false)
    @JsonIgnore
    private Inventory inventory;

    @ManyToOne
    @JoinColumn(name = "owner_office_id", nullable = false)
    private Office ownerOffice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemStatus status;

    private String serialNumber;

    private LocalDateTime purchaseDate;

    private Double purchasePrice;

    private LocalDateTime warrantyExpiry;

    private String remarks;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "itemInstance")
    @JsonIgnore
    private java.util.List<ItemTransaction> transactions;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = ItemStatus.AVAILABLE;
        }
    }

    public enum ItemStatus {
        AVAILABLE,      // Available in inventory
        IN_USE,         // Currently being used
        UNDER_REPAIR,   // Under maintenance/repair
        DAMAGED,        // Damaged but not disposed
        LOST,           // Lost/missing
        DISPOSED        // Disposed/scrapped
    }
}
