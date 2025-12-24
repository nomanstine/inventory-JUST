package just.inventory.backend.service;

import just.inventory.backend.model.*;
import just.inventory.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    // @Autowired
    // private InventoryRepository inventoryRepository;

    @Autowired
    private ItemInstanceRepository itemInstanceRepository;

    @Autowired
    private OfficeRepository officeRepository;

    public Inventory getInventoryByOfficeId(Long officeId) {
        Office office = officeRepository.findById(officeId)
                .orElseThrow(() -> new RuntimeException("Office not found"));
        
        Inventory inventory = office.getInventory();
        if (inventory == null) {
            throw new RuntimeException("Inventory not found for office");
        }
        
        return inventory;
    }

    public List<ItemInstance> getItemInstancesByOfficeId(Long officeId) {
        Inventory inventory = getInventoryByOfficeId(officeId);
        return itemInstanceRepository.findByInventoryId(inventory.getId());
    }

    public Map<String, Object> getInventorySummaryByOfficeId(Long officeId) {
        List<ItemInstance> instances = getItemInstancesByOfficeId(officeId);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("officeId", officeId);
        summary.put("totalItems", instances.size());
        
        // Group by item
        Map<String, List<ItemInstance>> byItem = instances.stream()
                .collect(Collectors.groupingBy(i -> i.getItem().getName()));
        
        List<Map<String, Object>> itemSummaries = byItem.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> itemSummary = new HashMap<>();
                    itemSummary.put("itemName", entry.getKey());
                    itemSummary.put("itemId", entry.getValue().get(0).getItem().getId());
                    itemSummary.put("quantity", entry.getValue().size());
                    
                    // Group by status
                    Map<ItemInstance.ItemStatus, Long> statusCount = entry.getValue().stream()
                            .collect(Collectors.groupingBy(ItemInstance::getStatus, Collectors.counting()));
                    itemSummary.put("statusBreakdown", statusCount);
                    
                    return itemSummary;
                })
                .collect(Collectors.toList());
        
        summary.put("items", itemSummaries);
        
        // Overall status breakdown
        Map<ItemInstance.ItemStatus, Long> overallStatus = instances.stream()
                .collect(Collectors.groupingBy(ItemInstance::getStatus, Collectors.counting()));
        summary.put("overallStatusBreakdown", overallStatus);
        
        return summary;
    }

    public ItemInstance getItemInstanceById(Long id) {
        return itemInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item instance not found"));
    }
}
