package just.inventory.backend.repository;

import just.inventory.backend.model.Office;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource
public interface OfficeRepository extends JpaRepository<Office, Long> {
    
} 