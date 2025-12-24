package just.inventory.backend.repository;

import just.inventory.backend.model.ItemInstance;
import just.inventory.backend.model.ItemInstance.ItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import java.util.List;
import java.util.Optional;

@RepositoryRestResource
public interface ItemInstanceRepository extends JpaRepository<ItemInstance, Long> {
    
    Optional<ItemInstance> findByBarcode(String barcode);
    
    List<ItemInstance> findByItemId(Long itemId);
    
    List<ItemInstance> findByInventoryId(Long inventoryId);
    
    List<ItemInstance> findByStatus(ItemStatus status);
    
    List<ItemInstance> findByInventoryIdAndStatus(Long inventoryId, ItemStatus status);
    
    List<ItemInstance> findByItemIdAndInventoryId(Long itemId, Long inventoryId);
    
    List<ItemInstance> findByOwnerOfficeId(Long officeId);
    
    List<ItemInstance> findByOwnerOfficeIdAndStatus(Long officeId, ItemStatus status);
    
    List<ItemInstance> findByItemIdAndOwnerOfficeId(Long itemId, Long officeId);
    
    Long countByInventoryIdAndStatus(Long inventoryId, ItemStatus status);
    
    Long countByItemIdAndInventoryId(Long itemId, Long inventoryId);
    
    Long countByOwnerOfficeIdAndStatus(Long officeId, ItemStatus status);
}
