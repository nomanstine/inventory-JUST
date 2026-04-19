package just.inventory.backend.controller;

import just.inventory.backend.dto.RequisitionSuggestionRequest;
import just.inventory.backend.dto.RequisitionSuggestionResponse;
import just.inventory.backend.model.ItemRequest;
import just.inventory.backend.model.Office;
import just.inventory.backend.model.User;
import just.inventory.backend.repository.OfficeRepository;
import just.inventory.backend.repository.UserRepository;
import just.inventory.backend.service.ItemRequestService;
import just.inventory.backend.service.RequisitionSuggestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/item-requests")
public class ItemRequestController {

    @Autowired
    private ItemRequestService itemRequestService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OfficeRepository officeRepository;

    @Autowired
    private RequisitionSuggestionService requisitionSuggestionService;

    @PostMapping
    public ResponseEntity<?> createItemRequest(@RequestBody ItemRequest itemRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is admin
        if (!"ADMIN".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Only admins can create item requests");
        }
        
        itemRequest.setRequestedBy(currentUser);
        itemRequest.setRequestingOffice(currentUser.getOffice());
        
        // Validate that a parent office is specified
        if (itemRequest.getParentOffice() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Parent office (office to request from) must be specified");
        }
        
        // Validate that the office is not requesting from itself
        if (itemRequest.getParentOffice().getId().equals(currentUser.getOffice().getId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Cannot request items from your own office");
        }
        
        ItemRequest createdRequest = itemRequestService.createItemRequest(itemRequest);
        return new ResponseEntity<>(createdRequest, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ItemRequest>> getAllItemRequests() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<ItemRequest> requests = itemRequestService.getRequestsByOffice(currentUser.getOffice().getId());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getItemRequestById(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        ItemRequest request = itemRequestService.getItemRequestById(id);
        
        // Check if user belongs to the requesting office
        if (!currentUser.getOffice().getId().equals(request.getRequestingOffice().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You can only view requests for your own office");
        }
        
        return ResponseEntity.ok(request);
    }

    @GetMapping("/office/{officeId}")
    public ResponseEntity<List<ItemRequest>> getRequestsByOffice(@PathVariable Long officeId) {
        List<ItemRequest> requests = itemRequestService.getRequestsByOffice(officeId);
        return ResponseEntity.ok(requests);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveRequest(
            @PathVariable Long id,
            @RequestBody ApprovalRequest approvalRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is admin
        if (!"ADMIN".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Only admins can approve requests");
        }
        
        ItemRequest request = itemRequestService.getItemRequestById(id);
        
        // Check if user belongs to the parent office
        if (!currentUser.getOffice().getId().equals(request.getParentOffice().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You can only approve requests for your office");
        }
        
        ItemRequest approved = itemRequestService.approveRequest(id, currentUser.getId(), 
            approvalRequest.getApprovedQuantity());
        return ResponseEntity.ok(approved);
    }

    @PutMapping("/{id}/fulfill")
    public ResponseEntity<?> fulfillRequest(
            @PathVariable Long id,
            @RequestBody FulfillmentRequest fulfillmentRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is admin
        if (!"ADMIN".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Only admins can fulfill requests");
        }
        
        ItemRequest request = itemRequestService.getItemRequestById(id);
        
        // Check if user belongs to the parent office
        if (!currentUser.getOffice().getId().equals(request.getParentOffice().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You can only fulfill requests for your office");
        }
        
        try {
            ItemRequest fulfilled = itemRequestService.fulfillRequest(
                id, currentUser.getId(), fulfillmentRequest.getQuantity());
            return ResponseEntity.ok(fulfilled);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectRequest(
            @PathVariable Long id,
            @RequestBody RejectionRequest rejectionRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is admin
        if (!"ADMIN".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Only admins can reject requests");
        }
        
        ItemRequest request = itemRequestService.getItemRequestById(id);
        
        // Check if user belongs to the parent office
        if (!currentUser.getOffice().getId().equals(request.getParentOffice().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You can only reject requests for your office");
        }
        
        ItemRequest rejected = itemRequestService.rejectRequest(id, currentUser.getId(), 
            rejectionRequest.getRemarks());
        return ResponseEntity.ok(rejected);
    }

    @GetMapping("/incoming")
    public ResponseEntity<?> getIncomingRequests() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<ItemRequest> requests = itemRequestService.getPendingRequestsForOffice(
            currentUser.getOffice().getId());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/my-requests")
    public ResponseEntity<?> getMyOfficeRequests() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<ItemRequest> requests = itemRequestService.getRequestsByOffice(
            currentUser.getOffice().getId());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/approved")
    public ResponseEntity<?> getApprovedRequests() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<ItemRequest> requests = itemRequestService.getApprovedRequestsForOffice(
            currentUser.getOffice().getId());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/fulfilled")
    public ResponseEntity<?> getFulfilledRequests() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<ItemRequest> requests = itemRequestService.getFulfilledRequestsForOffice(
            currentUser.getOffice().getId());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<ItemRequest> requests = itemRequestService.getHistoryForOffice(
            currentUser.getOffice().getId());
        return ResponseEntity.ok(requests);
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirmReceipt(
            @PathVariable Long id,
            @RequestBody ConfirmationRequest confirmationRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is admin
        if (!"ADMIN".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Only admins can confirm receipt");
        }
        
        ItemRequest request = itemRequestService.getItemRequestById(id);
        
        // Check if user belongs to the requesting office (receiver)
        if (!currentUser.getOffice().getId().equals(request.getRequestingOffice().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You can only confirm receipt for your office");
        }
        
        try {
            ItemRequest confirmed = itemRequestService.confirmReceipt(
                id, currentUser.getId(), confirmationRequest.getRemarks());
            return ResponseEntity.ok(confirmed);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
        }
    }

    @PostMapping("/suggestions")
    public ResponseEntity<?> getRequisitionSuggestions(@RequestBody RequisitionSuggestionRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (!"ADMIN".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Only admins can request requisition suggestions");
        }

        if (request.getParentOfficeId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Parent office is required for suggestion");
        }

        if (request.getParentOfficeId().equals(currentUser.getOffice().getId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Cannot request suggestions from your own office");
        }

        Office parentOffice = officeRepository.findById(request.getParentOfficeId())
            .orElseThrow(() -> new RuntimeException("Parent office not found"));

        RequisitionSuggestionResponse response = requisitionSuggestionService.suggest(
            currentUser.getOffice().getName(),
            parentOffice.getName(),
            request.getReason(),
            itemRequestService.getAvailableInstancesForOffice(parentOffice.getId()),
            itemRequestService.getRecentRequestsBetweenOffices(currentUser.getOffice().getId(), parentOffice.getId(), 15),
            itemRequestService.getCatalogItems()
        );

        return ResponseEntity.ok(response);
    }

    // DTOs
    public static class ApprovalRequest {
        private Double approvedQuantity;

        public Double getApprovedQuantity() {
            return approvedQuantity;
        }

        public void setApprovedQuantity(Double approvedQuantity) {
            this.approvedQuantity = approvedQuantity;
        }
    }

    public static class FulfillmentRequest {
        private int quantity;

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
    }

    public static class RejectionRequest {
        private String remarks;

        public String getRemarks() {
            return remarks;
        }

        public void setRemarks(String remarks) {
            this.remarks = remarks;
        }
    }

    public static class ConfirmationRequest {
        private String remarks;

        public String getRemarks() {
            return remarks;
        }

        public void setRemarks(String remarks) {
            this.remarks = remarks;
        }
    }
}
