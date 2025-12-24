package just.inventory.backend.service;

import just.inventory.backend.model.*;
import just.inventory.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ItemRequestService {

    @Autowired
    private ItemRequestRepository itemRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private OfficeRepository officeRepository;

    @Autowired
    private ItemTransactionRepository itemTransactionRepository;

    @Autowired
    private ItemInstanceRepository itemInstanceRepository;

    @Autowired
    private ItemDistributionService itemDistributionService;

    @Transactional
    public ItemRequest createItemRequest(ItemRequest itemRequest) {
        // Validate and set default values
        if (itemRequest.getStatus() == null) {
            itemRequest.setStatus(ItemRequest.RequestStatus.PENDING);
        }
        
        // Fetch and set relationships if only IDs are provided
        if (itemRequest.getItem() != null && itemRequest.getItem().getId() != null) {
            Item item = itemRepository.findById(itemRequest.getItem().getId())
                    .orElseThrow(() -> new RuntimeException("Item not found"));
            itemRequest.setItem(item);
        }
        
        if (itemRequest.getRequestingOffice() != null && itemRequest.getRequestingOffice().getId() != null) {
            Office office = officeRepository.findById(itemRequest.getRequestingOffice().getId())
                    .orElseThrow(() -> new RuntimeException("Requesting office not found"));
            itemRequest.setRequestingOffice(office);
        }
        
        if (itemRequest.getParentOffice() != null && itemRequest.getParentOffice().getId() != null) {
            Office parentOffice = officeRepository.findById(itemRequest.getParentOffice().getId())
                    .orElseThrow(() -> new RuntimeException("Parent office not found"));
            itemRequest.setParentOffice(parentOffice);
        }
        
        if (itemRequest.getRequestedBy() != null && itemRequest.getRequestedBy().getId() != null) {
            User user = userRepository.findById(itemRequest.getRequestedBy().getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            itemRequest.setRequestedBy(user);
        }
        
        return itemRequestRepository.save(itemRequest);
    }

    public List<ItemRequest> getAllItemRequests() {
        return itemRequestRepository.findAll();
    }

    public ItemRequest getItemRequestById(Long id) {
        return itemRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item request not found"));
    }

    public List<ItemRequest> getRequestsByOffice(Long officeId) {
        return itemRequestRepository.findByRequestingOfficeId(officeId);
    }

    @Transactional
    public ItemRequest approveRequest(Long requestId, Long approvedByUserId, Double approvedQuantity) {
        ItemRequest request = getItemRequestById(requestId);
        User approver = userRepository.findById(approvedByUserId)
                .orElseThrow(() -> new RuntimeException("Approver not found"));
        
        request.setStatus(ItemRequest.RequestStatus.APPROVED);
        request.setApprovedBy(approver);
        request.setApprovedQuantity(approvedQuantity);
        request.setApprovedDate(LocalDateTime.now());
        
        return itemRequestRepository.save(request);
    }

    @Transactional
    public ItemRequest fulfillRequest(Long requestId, Long fulfilledByUserId, int quantity) {
        ItemRequest request = getItemRequestById(requestId);
        
        // Check if request can be fulfilled
        if (request.getStatus() != ItemRequest.RequestStatus.APPROVED && 
            request.getStatus() != ItemRequest.RequestStatus.PARTIALLY_FULFILLED) {
            throw new RuntimeException("Request must be approved before fulfillment");
        }
        
        User fulfiller = userRepository.findById(fulfilledByUserId)
                .orElseThrow(() -> new RuntimeException("Fulfiller not found"));
        
        // Calculate current fulfilled quantity
        double currentFulfilled = request.getFulfilledQuantity() != null ? request.getFulfilledQuantity() : 0.0;
        double remainingToFulfill = request.getApprovedQuantity() - currentFulfilled;
        
        if (quantity > remainingToFulfill) {
            throw new RuntimeException("Cannot fulfill more than remaining quantity. Remaining: " + remainingToFulfill);
        }
        
        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }
        
        // Use distribution service to create PENDING distributions
        List<ItemTransaction> transactions = itemDistributionService.distributeItems(
            request.getParentOffice().getId(),
            request.getRequestingOffice().getId(),
            request.getItem().getId(),
            quantity,
            fulfiller,
            "Fulfilling request #" + requestId + " (" + quantity + " of " + request.getApprovedQuantity() + "): " + request.getReason()
        );
        
        // Update fulfilled quantity
        double newFulfilledQuantity = currentFulfilled + quantity;
        request.setFulfilledQuantity(newFulfilledQuantity);
        
        // Update status based on fulfillment progress
        if (newFulfilledQuantity >= request.getApprovedQuantity()) {
            request.setStatus(ItemRequest.RequestStatus.FULFILLED);
        } else {
            request.setStatus(ItemRequest.RequestStatus.PARTIALLY_FULFILLED);
        }
        
        request.setFulfilledDate(LocalDateTime.now());
        
        return itemRequestRepository.save(request);
    }

    @Transactional
    public ItemRequest rejectRequest(Long requestId, Long approvedByUserId, String remarks) {
        ItemRequest request = getItemRequestById(requestId);
        User approver = userRepository.findById(approvedByUserId)
                .orElseThrow(() -> new RuntimeException("Approver not found"));
        
        request.setStatus(ItemRequest.RequestStatus.REJECTED);
        request.setApprovedBy(approver);
        request.setRemarks(remarks);
        request.setRejectedDate(LocalDateTime.now());
        
        return itemRequestRepository.save(request);
    }

    public List<ItemRequest> getPendingRequestsForOffice(Long officeId) {
        return itemRequestRepository.findByParentOfficeIdAndStatus(officeId, ItemRequest.RequestStatus.PENDING);
    }

    public List<ItemRequest> getApprovedRequestsForOffice(Long officeId) {
        return itemRequestRepository.findByParentOfficeIdAndStatus(officeId, ItemRequest.RequestStatus.APPROVED);
    }
}
