package just.inventory.backend.repository;

import just.inventory.backend.model.ItemRequest;
import just.inventory.backend.model.ItemRequest.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import java.util.List;

@RepositoryRestResource
public interface ItemRequestRepository extends JpaRepository<ItemRequest, Long> {
    
    List<ItemRequest> findByRequestingOfficeId(Long officeId);
    
    List<ItemRequest> findByParentOfficeId(Long officeId);
    
    List<ItemRequest> findByRequestedById(Long userId);
    
    List<ItemRequest> findByStatus(RequestStatus status);
    
    List<ItemRequest> findByParentOfficeIdAndStatus(Long officeId, RequestStatus status);
    
    List<ItemRequest> findByRequestingOfficeIdAndStatus(Long officeId, RequestStatus status);
}
