package just.inventory.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonProperty("name")
    private String fullName;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"users"})
    private Role role;

    @JsonProperty("role")
    public String getRoleName() {
        return role != null ? role.getName() : null;
    }

    @JsonIgnore
    public Role getRole() {
        return role;
    }
    @ManyToOne
    @JoinColumn(name = "office_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"parent", "subOffices", "ownedItems", "users", "inventory", "outgoingTransactions", "incomingTransactions", "sentRequests", "receivedRequests"})
    private Office office;
    
    @OneToMany(mappedBy = "user")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<ItemTransaction> transactions;
    
    @OneToMany(mappedBy = "requestedBy")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<ItemRequest> requestedItems;
    
    @OneToMany(mappedBy = "approvedBy")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<ItemRequest> approvedRequests;
}
