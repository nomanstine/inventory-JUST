package just.inventory.backend.controller;

import just.inventory.backend.model.ItemTransaction;
import just.inventory.backend.model.User;
import just.inventory.backend.repository.UserRepository;
import just.inventory.backend.service.ItemDistributionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/distributions")
public class ItemDistributionController {

    @Autowired
    private ItemDistributionService distributionService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> distributeItems(@RequestBody DistributionRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is admin
        if (!"Admin".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Only admins can distribute items");
        }
        
        // Check if user belongs to the source office
        if (!currentUser.getOffice().getId().equals(request.getFromOfficeId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You can only distribute items from your own office");
        }
        
        try {
            List<ItemTransaction> transactions = distributionService.distributeItems(
                request.getFromOfficeId(),
                request.getToOfficeId(),
                request.getItemId(),
                request.getQuantity(),
                currentUser,
                request.getRemarks()
            );
            
            return new ResponseEntity<>(transactions, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
        }
    }

    @GetMapping("/office/{officeId}/history")
    public ResponseEntity<?> getOfficeTransactionHistory(@PathVariable Long officeId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user belongs to the office or is admin
        if (!currentUser.getOffice().getId().equals(officeId) && 
            !"Admin".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You can only view transaction history for your own office");
        }
        
        List<ItemTransaction> history = distributionService.getTransactionHistory(officeId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/item/{itemInstanceId}/history")
    public ResponseEntity<?> getItemTransactionHistory(@PathVariable Long itemInstanceId) {
        List<ItemTransaction> history = distributionService.getItemTransactionHistory(itemInstanceId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/my-office/history")
    public ResponseEntity<?> getMyOfficeTransactionHistory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<ItemTransaction> history = distributionService.getTransactionHistory(currentUser.getOffice().getId());
        return ResponseEntity.ok(history);
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingDistributions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<ItemTransaction> pending = distributionService.getPendingDistributions(currentUser.getOffice().getId());
        return ResponseEntity.ok(pending);
    }

    @PostMapping("/{transactionId}/confirm")
    public ResponseEntity<?> confirmDistribution(@PathVariable Long transactionId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is admin
        if (!"Admin".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Only admins can confirm distributions");
        }
        
        try {
            ItemTransaction transaction = distributionService.confirmDistribution(transactionId, currentUser);
            return ResponseEntity.ok(transaction);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
        }
    }

    @PostMapping("/{transactionId}/reject")
    public ResponseEntity<?> rejectDistribution(@PathVariable Long transactionId, 
                                                 @RequestBody RejectionRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is admin
        if (!"Admin".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Only admins can reject distributions");
        }
        
        try {
            ItemTransaction transaction = distributionService.rejectDistribution(
                transactionId, currentUser, request.getReason());
            return ResponseEntity.ok(transaction);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
        }
    }

    // DTO for distribution request
    public static class DistributionRequest {
        private Long fromOfficeId;
        private Long toOfficeId;
        private Long itemId;
        private int quantity;
        private String remarks;

        public Long getFromOfficeId() {
            return fromOfficeId;
        }

        public void setFromOfficeId(Long fromOfficeId) {
            this.fromOfficeId = fromOfficeId;
        }

        public Long getToOfficeId() {
            return toOfficeId;
        }

        public void setToOfficeId(Long toOfficeId) {
            this.toOfficeId = toOfficeId;
        }

        public Long getItemId() {
            return itemId;
        }

        public void setItemId(Long itemId) {
            this.itemId = itemId;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }

        public String getRemarks() {
            return remarks;
        }

        public void setRemarks(String remarks) {
            this.remarks = remarks;
        }
    }

    // DTO for rejection request
    public static class RejectionRequest {
        private String reason;

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}
