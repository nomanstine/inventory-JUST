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
        if (purchase.getItem() != null && purchase.getItem().getId() != null) {
            Item item = itemRepository.findById(purchase.getItem().getId())
                    .orElseThrow(() -> new RuntimeException("Item not found"));
            purchase.setItem(item);
        }
        
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
        
        Purchase savedPurchase = purchaseRepository.save(purchase);
        
        // Create item instances
        Inventory inventory = savedPurchase.getOffice().getInventory();
        if (inventory == null) {
            throw new RuntimeException("Office does not have an inventory");
        }
        
        for (int i = 0; i < savedPurchase.getQuantity(); i++) {
            ItemInstance instance = new ItemInstance();
            instance.setItem(savedPurchase.getItem());
            instance.setBarcode(savedPurchase.getItem().getName().substring(0, 3).toUpperCase() + "-" + savedPurchase.getOffice().getCode() + "-" + System.currentTimeMillis() + "-" + i);
            instance.setInventory(inventory);
            instance.setOwnerOffice(savedPurchase.getOffice());
            instance.setStatus(ItemInstance.ItemStatus.AVAILABLE);
            instance.setPurchaseDate(savedPurchase.getPurchasedDate());
            itemInstanceRepository.save(instance);
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
}