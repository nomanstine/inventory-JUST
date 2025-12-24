package just.inventory.backend.service;

import just.inventory.backend.model.*;
import just.inventory.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ItemTrackingService {

    @Autowired
    private ItemInstanceRepository itemInstanceRepository;

    @Autowired
    private ItemTransactionRepository itemTransactionRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    public Map<String, Object> trackItemByBarcode(String barcode) {
        // Find the item instance
        ItemInstance itemInstance = itemInstanceRepository.findByBarcode(barcode)
                .orElseThrow(() -> new RuntimeException("Item not found with barcode: " + barcode));
        
        Map<String, Object> trackingInfo = new LinkedHashMap<>();
        
        // Basic item information
        trackingInfo.put("barcode", itemInstance.getBarcode());
        trackingInfo.put("itemId", itemInstance.getItem().getId());
        trackingInfo.put("itemName", itemInstance.getItem().getName());
        trackingInfo.put("itemDescription", itemInstance.getItem().getDescription());
        trackingInfo.put("category", itemInstance.getItem().getCategory().getName());
        trackingInfo.put("serialNumber", itemInstance.getSerialNumber());
        trackingInfo.put("currentStatus", itemInstance.getStatus());
        trackingInfo.put("currentOwnerOffice", itemInstance.getOwnerOffice().getName());
        trackingInfo.put("currentOwnerOfficeCode", itemInstance.getOwnerOffice().getCode());
        trackingInfo.put("purchaseDate", itemInstance.getPurchaseDate());
        trackingInfo.put("warrantyExpiry", itemInstance.getWarrantyExpiry());
        trackingInfo.put("remarks", itemInstance.getRemarks());
        trackingInfo.put("createdAt", itemInstance.getCreatedAt());
        
        // Find purchase information
        Purchase purchase = purchaseRepository.findAll().stream()
                .filter(p -> p.getPurchasedDate().equals(itemInstance.getPurchaseDate()) &&
                            p.getItem().getId().equals(itemInstance.getItem().getId()))
                .findFirst()
                .orElse(null);
        
        if (purchase != null) {
            Map<String, Object> purchaseInfo = new LinkedHashMap<>();
            purchaseInfo.put("purchaseId", purchase.getId());
            purchaseInfo.put("quantity", purchase.getQuantity());
            purchaseInfo.put("unitPrice", purchase.getUnitPrice());
            purchaseInfo.put("totalCost", purchase.getQuantity() * purchase.getUnitPrice());
            purchaseInfo.put("supplier", purchase.getSupplier());
            purchaseInfo.put("purchasedBy", purchase.getPurchasedBy().getFullName());
            purchaseInfo.put("purchasedByUsername", purchase.getPurchasedBy().getUsername());
            purchaseInfo.put("purchasedForOffice", purchase.getOffice().getName());
            purchaseInfo.put("purchaseDate", purchase.getPurchasedDate());
            purchaseInfo.put("remarks", purchase.getRemarks());
            trackingInfo.put("purchaseInformation", purchaseInfo);
        }
        
        // Get all transactions for this item (movements)
        List<ItemTransaction> transactions = itemTransactionRepository
                .findByItemInstanceId(itemInstance.getId());
        
        List<Map<String, Object>> movementHistory = new ArrayList<>();
        for (ItemTransaction transaction : transactions) {
            Map<String, Object> movement = new LinkedHashMap<>();
            movement.put("transactionId", transaction.getId());
            movement.put("transactionType", transaction.getTransactionType());
            movement.put("status", transaction.getStatus());
            movement.put("date", transaction.getTransactionDate());
            
            if (transaction.getFromOffice() != null) {
                movement.put("fromOffice", transaction.getFromOffice().getName());
                movement.put("fromOfficeCode", transaction.getFromOffice().getCode());
            }
            
            if (transaction.getToOffice() != null) {
                movement.put("toOffice", transaction.getToOffice().getName());
                movement.put("toOfficeCode", transaction.getToOffice().getCode());
            }
            
            movement.put("initiatedBy", transaction.getUser().getFullName());
            movement.put("initiatedByUsername", transaction.getUser().getUsername());
            
            if (transaction.getConfirmedBy() != null) {
                movement.put("confirmedBy", transaction.getConfirmedBy().getFullName());
                movement.put("confirmedByUsername", transaction.getConfirmedBy().getUsername());
                movement.put("confirmedDate", transaction.getConfirmedDate());
            }
            
            movement.put("quantity", transaction.getQuantity());
            movement.put("remarks", transaction.getRemarks());
            
            movementHistory.add(movement);
        }
        
        trackingInfo.put("totalMovements", movementHistory.size());
        trackingInfo.put("movementHistory", movementHistory);
        
        // Movement summary
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalTransfers", transactions.stream()
                .filter(t -> t.getTransactionType() == ItemTransaction.TransactionType.DISTRIBUTION ||
                            t.getTransactionType() == ItemTransaction.TransactionType.TRANSFER)
                .count());
        summary.put("confirmedTransfers", transactions.stream()
                .filter(t -> t.getStatus() == ItemTransaction.TransactionStatus.CONFIRMED)
                .count());
        summary.put("rejectedTransfers", transactions.stream()
                .filter(t -> t.getStatus() == ItemTransaction.TransactionStatus.REJECTED)
                .count());
        summary.put("pendingTransfers", transactions.stream()
                .filter(t -> t.getStatus() == ItemTransaction.TransactionStatus.PENDING)
                .count());
        
        trackingInfo.put("movementSummary", summary);
        
        // Office journey (chronological path)
        List<String> officeJourney = new ArrayList<>();
        if (purchase != null) {
            officeJourney.add("Purchased by: " + purchase.getOffice().getName());
        }
        for (ItemTransaction transaction : transactions) {
            if (transaction.getStatus() == ItemTransaction.TransactionStatus.CONFIRMED) {
                if (transaction.getFromOffice() != null && transaction.getToOffice() != null) {
                    officeJourney.add(transaction.getFromOffice().getCode() + " → " + 
                                     transaction.getToOffice().getCode() + 
                                     " (" + transaction.getTransactionDate() + ")");
                }
            }
        }
        officeJourney.add("Current: " + itemInstance.getOwnerOffice().getName());
        trackingInfo.put("officeJourney", officeJourney);
        
        return trackingInfo;
    }

    public List<Map<String, Object>> trackMultipleItems(List<String> barcodes) {
        List<Map<String, Object>> results = new ArrayList<>();
        for (String barcode : barcodes) {
            try {
                results.add(trackItemByBarcode(barcode));
            } catch (RuntimeException e) {
                Map<String, Object> error = new LinkedHashMap<>();
                error.put("barcode", barcode);
                error.put("error", e.getMessage());
                results.add(error);
            }
        }
        return results;
    }
}
