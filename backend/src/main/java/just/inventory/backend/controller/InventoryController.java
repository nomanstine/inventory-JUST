package just.inventory.backend.controller;

import just.inventory.backend.model.Inventory;
import just.inventory.backend.model.ItemInstance;
import just.inventory.backend.model.User;
import just.inventory.backend.repository.UserRepository;
import just.inventory.backend.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventories")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/office/{officeId}")
    public ResponseEntity<?> getInventoryByOffice(@PathVariable Long officeId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user belongs to the same office or is admin
        if (!currentUser.getOffice().getId().equals(officeId) && 
            !"Admin".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(403)
                .body("You can only view inventory for your own office");
        }
        
        Inventory inventory = inventoryService.getInventoryByOfficeId(officeId);
        return ResponseEntity.ok(inventory);
    }

    @GetMapping("/office/{officeId}/items")
    public ResponseEntity<?> getItemInstancesByOffice(@PathVariable Long officeId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user belongs to the same office or is admin
        if (!currentUser.getOffice().getId().equals(officeId) && 
            !"Admin".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(403)
                .body("You can only view inventory for your own office");
        }
        
        List<ItemInstance> instances = inventoryService.getItemInstancesByOfficeId(officeId);
        return ResponseEntity.ok(instances);
    }

    @GetMapping("/office/{officeId}/summary")
    public ResponseEntity<?> getInventorySummary(@PathVariable Long officeId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user belongs to the same office or is admin
        if (!currentUser.getOffice().getId().equals(officeId) && 
            !"Admin".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(403)
                .body("You can only view inventory for your own office");
        }
        
        Map<String, Object> summary = inventoryService.getInventorySummaryByOfficeId(officeId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<?> getItemInstanceById(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        ItemInstance instance = inventoryService.getItemInstanceById(id);
        
        // Check if user belongs to the same office or is admin
        if (!currentUser.getOffice().getId().equals(instance.getOwnerOffice().getId()) && 
            !"Admin".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(403)
                .body("You can only view items for your own office");
        }
        
        return ResponseEntity.ok(instance);
    }

    @GetMapping("/my-office")
    public ResponseEntity<?> getMyOfficeInventory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<ItemInstance> instances = inventoryService.getItemInstancesByOfficeId(currentUser.getOffice().getId());
        return ResponseEntity.ok(instances);
    }

    @GetMapping("/my-office/summary")
    public ResponseEntity<?> getMyOfficeInventorySummary() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, Object> summary = inventoryService.getInventorySummaryByOfficeId(currentUser.getOffice().getId());
        return ResponseEntity.ok(summary);
    }
}
