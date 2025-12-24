package just.inventory.backend.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Entity
@Table(name = "inventories")
@Data
@NoArgsConstructor
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(hidden = true)
    private Long id;

    @OneToOne
    @JoinColumn(name = "office_id")
    @JsonIgnore
    private Office office;

    @OneToMany(mappedBy = "inventory", cascade = CascadeType.ALL)
    private List<ItemInstance> itemInstances;
}
