package just.inventory.backend.repository;

import just.inventory.backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.Optional;

@RepositoryRestResource
public interface RoleRepository extends JpaRepository<Role,Long> {
	Optional<Role> findByName(String name);
}
