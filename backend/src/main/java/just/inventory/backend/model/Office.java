package just.inventory.backend.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "offices")
@Data
@NoArgsConstructor
public class Office {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(hidden = true)
    private Long id;

    private String name;
    private String description;
    private String code;
    
    @ManyToOne
    @JoinColumn(name = "parent_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"parent", "subOffices", "ownedItems", "users", "inventory", "outgoingTransactions", "incomingTransactions", "sentRequests", "receivedRequests"})
    private Office parent;
    
    @OneToMany(mappedBy = "parent")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<Office> subOffices;
    
    @OneToMany(mappedBy = "ownerOffice")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<ItemInstance> ownedItems;
    
    @OneToMany(mappedBy = "office")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<User> users;

    @OneToOne(mappedBy = "office", cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Inventory inventory;
    
    @OneToMany(mappedBy = "fromOffice")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<ItemTransaction> outgoingTransactions;
    
    @OneToMany(mappedBy = "toOffice")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<ItemTransaction> incomingTransactions;
    
    @OneToMany(mappedBy = "requestingOffice")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<ItemRequest> sentRequests;
    
    @OneToMany(mappedBy = "parentOffice")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<ItemRequest> receivedRequests;
}
