package just.inventory.backend.controller;

import just.inventory.backend.model.Purchase;
import just.inventory.backend.model.User;
import just.inventory.backend.repository.UserRepository;
import just.inventory.backend.service.PurchaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    @Autowired
    private PurchaseService purchaseService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createPurchase(@RequestBody Purchase purchase) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (currentUser.getOffice() == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("User office is null for user: " + username);
        }
        
        // Check if user is admin
        if (!"Admin".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Only admins can create purchases");
        }
        
        purchase.setPurchasedBy(currentUser);
        purchase.setOffice(currentUser.getOffice());
        Purchase createdPurchase = purchaseService.createPurchase(purchase);
        return new ResponseEntity<>(createdPurchase, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Purchase>> getAllPurchases() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Purchase> purchases = purchaseService.getPurchasesByOffice(currentUser.getOffice().getId());
        return ResponseEntity.ok(purchases);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPurchaseById(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Purchase purchase = purchaseService.getPurchaseById(id);
        
        // Check if user belongs to the same office
        if (!currentUser.getOffice().getId().equals(purchase.getOffice().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You can only view purchases for your own office");
        }
        
        return ResponseEntity.ok(purchase);
    }

    @GetMapping("/office/{officeId}")
    public ResponseEntity<List<Purchase>> getPurchasesByOffice(@PathVariable Long officeId) {
        List<Purchase> purchases = purchaseService.getPurchasesByOffice(officeId);
        return ResponseEntity.ok(purchases);
    }
}