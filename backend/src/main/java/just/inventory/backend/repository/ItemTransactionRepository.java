package just.inventory.backend.repository;

import just.inventory.backend.model.ItemTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import java.util.List;

@RepositoryRestResource
public interface ItemTransactionRepository extends JpaRepository<ItemTransaction, Long> {
    
    List<ItemTransaction> findByItemInstanceId(Long itemInstanceId);
    
    List<ItemTransaction> findByFromOfficeId(Long officeId);
    
    List<ItemTransaction> findByToOfficeId(Long officeId);
    
    List<ItemTransaction> findByUserId(Long userId);
    
    List<ItemTransaction> findByTransactionType(ItemTransaction.TransactionType transactionType);
    
    List<ItemTransaction> findByStatus(ItemTransaction.TransactionStatus status);
    
    List<ItemTransaction> findByToOfficeIdAndStatus(Long toOfficeId, ItemTransaction.TransactionStatus status);
    
    List<ItemTransaction> findByFromOfficeIdAndStatus(Long fromOfficeId, ItemTransaction.TransactionStatus status);
}
