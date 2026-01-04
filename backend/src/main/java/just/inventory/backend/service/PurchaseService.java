package just.inventory.backend.service;

import just.inventory.backend.model.*;
import just.inventory.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PurchaseService {

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ItemInstanceRepository itemInstanceRepository;

    @Autowired
    private OfficeRepository officeRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Purchase createPurchase(Purchase purchase) {
        // Fetch and set relationships
        if (purchase.getOffice() != null && purchase.getOffice().getId() != null) {
            Office office = officeRepository.findById(purchase.getOffice().getId())
                    .orElseThrow(() -> new RuntimeException("Office not found"));
            purchase.setOffice(office);
        }
        
        if (purchase.getPurchasedBy() != null && purchase.getPurchasedBy().getId() != null) {
            User user = userRepository.findById(purchase.getPurchasedBy().getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            purchase.setPurchasedBy(user);
        }
        
        // Save the purchase header first
        Purchase savedPurchase = purchaseRepository.save(purchase);
        
        // Get inventory for this office
        Inventory inventory = savedPurchase.getOffice().getInventory();
        if (inventory == null) {
            throw new RuntimeException("Office does not have an inventory");
        }
        
        // Process each purchase item
        for (PurchaseItem purchaseItem : purchase.getItems()) {
            // Fetch and set item
            if (purchaseItem.getItem() != null && purchaseItem.getItem().getId() != null) {
                Item item = itemRepository.findById(purchaseItem.getItem().getId())
                        .orElseThrow(() -> new RuntimeException("Item not found"));
                purchaseItem.setItem(item);
            }
            
            // Link to purchase
            purchaseItem.setPurchase(savedPurchase);
            
            // Store created item instances
            java.util.List<ItemInstance> createdInstances = new java.util.ArrayList<>();
            
            // Create item instances for this purchase item
            for (int i = 0; i < purchaseItem.getQuantity(); i++) {
                ItemInstance instance = new ItemInstance();
                instance.setItem(purchaseItem.getItem());
                instance.setBarcode(purchaseItem.getItem().getName().substring(0, 3).toUpperCase() 
                    + "-" + savedPurchase.getOffice().getCode() 
                    + "-" + System.currentTimeMillis() 
                    + "-" + i);
                instance.setInventory(inventory);
                instance.setOwnerOffice(savedPurchase.getOffice());
                instance.setStatus(ItemInstance.ItemStatus.AVAILABLE);
                instance.setPurchaseDate(savedPurchase.getPurchasedDate());
                instance.setPurchasePrice(purchaseItem.getUnitPrice());
                ItemInstance savedInstance = itemInstanceRepository.save(instance);
                createdInstances.add(savedInstance);
            }
        }
        
        return savedPurchase;
    }

    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    public Purchase getPurchaseById(Long id) {
        return purchaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found"));
    }

    public List<Purchase> getPurchasesByOffice(Long officeId) {
        return purchaseRepository.findByOfficeId(officeId);
    }
    
    /**
     * Get item instances for a specific purchase item
     * This queries instances by item, office and purchase date
     */
    public List<ItemInstance> getItemInstancesForPurchase(Long itemId, Long officeId, Purchase purchase) {
        return itemInstanceRepository.findByItemIdAndOwnerOfficeId(itemId, officeId)
                .stream()
                .filter(instance -> instance.getPurchaseDate() != null && 
                        instance.getPurchaseDate().equals(purchase.getPurchasedDate()))
                .collect(java.util.stream.Collectors.toList());
    }
}