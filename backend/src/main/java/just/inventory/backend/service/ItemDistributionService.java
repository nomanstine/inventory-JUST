package just.inventory.backend.service;

import just.inventory.backend.model.*;
import just.inventory.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

import java.util.ArrayList;
import java.util.List;

@Service
public class ItemDistributionService {

    @Autowired
    private ItemInstanceRepository itemInstanceRepository;

    @Autowired
    private OfficeRepository officeRepository;

    @Autowired
    private ItemTransactionRepository itemTransactionRepository;

    @Transactional
    public List<ItemTransaction> distributeItems(Long fromOfficeId, Long toOfficeId, Long itemId, 
                                                   int quantity, User distributedBy, String remarks) {
        // Validate offices
        Office fromOffice = officeRepository.findById(fromOfficeId)
                .orElseThrow(() -> new RuntimeException("Source office not found"));
        Office toOffice = officeRepository.findById(toOfficeId)
                .orElseThrow(() -> new RuntimeException("Destination office not found"));
        
        // Check if toOffice is a child of fromOffice
        if (toOffice.getParent() == null || !toOffice.getParent().getId().equals(fromOfficeId)) {
            throw new RuntimeException("Can only distribute to direct child offices");
        }
        
        // Get available items from source office inventory
        Inventory fromInventory = fromOffice.getInventory();
        if (fromInventory == null) {
            throw new RuntimeException("Source office does not have an inventory");
        }
        
        List<ItemInstance> availableItems = itemInstanceRepository
                .findByInventoryIdAndStatus(fromInventory.getId(), ItemInstance.ItemStatus.AVAILABLE)
                .stream()
                .filter(i -> i.getItem().getId().equals(itemId))
                .limit(quantity)
                .toList();
        
        if (availableItems.size() < quantity) {
            throw new RuntimeException("Not enough available items. Requested: " + quantity + 
                                     ", Available: " + availableItems.size());
        }
        
        // Validate destination inventory exists
        Inventory toInventory = toOffice.getInventory();
        if (toInventory == null) {
            throw new RuntimeException("Destination office does not have an inventory");
        }
        
        List<ItemTransaction> transactions = new ArrayList<>();
        
        // Create PENDING distribution transactions (items not yet transferred)
        for (ItemInstance item : availableItems) {
            // Mark item as IN_USE (reserved for distribution)
            item.setStatus(ItemInstance.ItemStatus.IN_USE);
            itemInstanceRepository.save(item);
            
            // Create pending transaction record
            ItemTransaction transaction = new ItemTransaction();
            transaction.setItemInstance(item);
            transaction.setFromOffice(fromOffice);
            transaction.setToOffice(toOffice);
            transaction.setUser(distributedBy);
            transaction.setTransactionType(ItemTransaction.TransactionType.DISTRIBUTION);
            transaction.setStatus(ItemTransaction.TransactionStatus.PENDING);
            transaction.setQuantity(1.0);
            transaction.setRemarks(remarks);
            
            transactions.add(itemTransactionRepository.save(transaction));
        }
        
        return transactions;
    }

    @Transactional
    public ItemTransaction confirmDistribution(Long transactionId, User confirmedBy) {
        ItemTransaction transaction = itemTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        
        if (transaction.getStatus() != ItemTransaction.TransactionStatus.PENDING) {
            throw new RuntimeException("Transaction is not pending confirmation");
        }
        
        // Transfer the item
        ItemInstance item = transaction.getItemInstance();
        Inventory toInventory = transaction.getToOffice().getInventory();
        
        item.setInventory(toInventory);
        item.setOwnerOffice(transaction.getToOffice());
        item.setStatus(ItemInstance.ItemStatus.AVAILABLE);
        itemInstanceRepository.save(item);
        
        // Update transaction status
        transaction.setStatus(ItemTransaction.TransactionStatus.CONFIRMED);
        transaction.setConfirmedBy(confirmedBy);
        transaction.setConfirmedDate(LocalDateTime.now());
        
        return itemTransactionRepository.save(transaction);
    }

    @Transactional
    public ItemTransaction rejectDistribution(Long transactionId, User rejectedBy, String reason) {
        ItemTransaction transaction = itemTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        
        if (transaction.getStatus() != ItemTransaction.TransactionStatus.PENDING) {
            throw new RuntimeException("Transaction is not pending confirmation");
        }
        
        // Return item to available status in original inventory
        ItemInstance item = transaction.getItemInstance();
        item.setStatus(ItemInstance.ItemStatus.AVAILABLE);
        itemInstanceRepository.save(item);
        
        // Update transaction status
        transaction.setStatus(ItemTransaction.TransactionStatus.REJECTED);
        transaction.setConfirmedBy(rejectedBy);
        transaction.setConfirmedDate(LocalDateTime.now());
        transaction.setRemarks(transaction.getRemarks() + " | REJECTED: " + reason);
        
        return itemTransactionRepository.save(transaction);
    }

    public List<ItemTransaction> getPendingDistributions(Long officeId) {
        return itemTransactionRepository.findByToOfficeIdAndStatus(
            officeId, ItemTransaction.TransactionStatus.PENDING);
    }

    public List<ItemTransaction> getTransactionHistory(Long officeId) {
        List<ItemTransaction> sent = itemTransactionRepository.findByFromOfficeId(officeId);
        List<ItemTransaction> received = itemTransactionRepository.findByToOfficeId(officeId);
        
        List<ItemTransaction> all = new ArrayList<>();
        all.addAll(sent);
        all.addAll(received);
        
        return all;
    }

    public List<ItemTransaction> getItemTransactionHistory(Long itemInstanceId) {
        return itemTransactionRepository.findByItemInstanceId(itemInstanceId);
    }
}
