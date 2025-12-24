package just.inventory.backend.repository;

import just.inventory.backend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
// import java.util.Optional;

@RepositoryRestResource
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // Optional<Category> findByName(String name);
}