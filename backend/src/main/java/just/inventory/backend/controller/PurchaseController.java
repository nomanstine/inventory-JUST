package just.inventory.backend.controller;

import just.inventory.backend.dto.CreatePurchaseRequest;
import just.inventory.backend.dto.PurchaseResponse;
import just.inventory.backend.model.Item;
import just.inventory.backend.model.Purchase;
import just.inventory.backend.model.PurchaseItem;
import just.inventory.backend.model.User;
import just.inventory.backend.repository.ItemRepository;
import just.inventory.backend.repository.UserRepository;
import just.inventory.backend.service.PurchaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    @Autowired
    private PurchaseService purchaseService;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ItemRepository itemRepository;

    @PostMapping
    public ResponseEntity<?> createPurchase(@RequestBody CreatePurchaseRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (currentUser.getOffice() == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("User office is null for user: " + username);
        }
        
        // Check if user is admin
        if (!"ADMIN".equals(currentUser.getRole().getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Only admins can create purchases");
        }
        
        // Build Purchase entity from request
        Purchase purchase = new Purchase();
        purchase.setSupplier(request.getSupplier());
        purchase.setInvoiceNumber(request.getInvoiceNumber());
        purchase.setRemarks(request.getRemarks());
        purchase.setReceiptUrl(request.getReceiptUrl());
        purchase.setPurchasedBy(currentUser);
        purchase.setOffice(currentUser.getOffice());
        
        // Add purchase items
        for (CreatePurchaseRequest.PurchaseItemRequest itemRequest : request.getItems()) {
            Item item = itemRepository.findById(itemRequest.getItemId())
                    .orElseThrow(() -> new RuntimeException("Item not found: " + itemRequest.getItemId()));
            
            PurchaseItem purchaseItem = new PurchaseItem();
            purchaseItem.setItem(item);
            purchaseItem.setQuantity(itemRequest.getQuantity());
            purchaseItem.setUnitPrice(itemRequest.getUnitPrice());
            purchaseItem.setPurchase(purchase);
            
            purchase.getItems().add(purchaseItem);
        }
        
        Purchase createdPurchase = purchaseService.createPurchase(purchase);
        PurchaseResponse response = mapToResponse(createdPurchase);
        
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<PurchaseResponse>> getAllPurchases() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Purchase> purchases = purchaseService.getPurchasesByOffice(currentUser.getOffice().getId());
        List<PurchaseResponse> responses = purchases.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
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
        
        PurchaseResponse response = mapToResponse(purchase);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/office/{officeId}")
    public ResponseEntity<List<PurchaseResponse>> getPurchasesByOffice(@PathVariable Long officeId) {
        List<Purchase> purchases = purchaseService.getPurchasesByOffice(officeId);
        List<PurchaseResponse> responses = purchases.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }
    
    private PurchaseResponse mapToResponse(Purchase purchase) {
        PurchaseResponse response = new PurchaseResponse();
        response.setId(purchase.getId());
        response.setSupplier(purchase.getSupplier());
        response.setInvoiceNumber(purchase.getInvoiceNumber());
        response.setRemarks(purchase.getRemarks());
        response.setReceiptUrl(purchase.getReceiptUrl());
        response.setPurchasedDate(purchase.getPurchasedDate());
        response.setTotalAmount(purchase.getTotalAmount());
        response.setTotalItems(purchase.getTotalItems());
        
        // Map user
        PurchaseResponse.UserSummary userSummary = new PurchaseResponse.UserSummary();
        userSummary.setId(purchase.getPurchasedBy().getId());
        userSummary.setUsername(purchase.getPurchasedBy().getUsername());
        userSummary.setName(purchase.getPurchasedBy().getFullName());
        userSummary.setFullName(purchase.getPurchasedBy().getFullName());
        response.setPurchasedBy(userSummary);
        
        // Map office
        PurchaseResponse.OfficeSummary officeSummary = new PurchaseResponse.OfficeSummary();
        officeSummary.setId(purchase.getOffice().getId());
        officeSummary.setName(purchase.getOffice().getName());
        response.setOffice(officeSummary);
        
        // Map items
        List<PurchaseResponse.PurchaseItemResponse> itemResponses = purchase.getItems().stream()
                .map(item -> {
                    PurchaseResponse.PurchaseItemResponse itemResponse = new PurchaseResponse.PurchaseItemResponse();
                    itemResponse.setId(item.getId());
                    itemResponse.setQuantity(item.getQuantity());
                    itemResponse.setUnitPrice(item.getUnitPrice());
                    itemResponse.setTotalPrice(item.getTotalPrice());
                    
                    PurchaseResponse.ItemSummary itemSummary = new PurchaseResponse.ItemSummary();
                    itemSummary.setId(item.getItem().getId());
                    itemSummary.setName(item.getItem().getName());
                    itemResponse.setItem(itemSummary);
                    
                    // Get item instances created for this purchase item
                    List<just.inventory.backend.model.ItemInstance> instances = 
                        purchaseService.getItemInstancesForPurchase(
                            item.getItem().getId(), 
                            purchase.getOffice().getId(), 
                            purchase
                        );
                    itemResponse.setItemInstanceIds(
                        instances.stream()
                            .map(just.inventory.backend.model.ItemInstance::getId)
                            .collect(Collectors.toList())
                    );
                    itemResponse.setItemBarcodes(
                        instances.stream()
                            .map(just.inventory.backend.model.ItemInstance::getBarcode)
                            .collect(Collectors.toList())
                    );
                    
                    return itemResponse;
                })
                .collect(Collectors.toList());
        response.setItems(itemResponses);
        
        return response;
    }
}