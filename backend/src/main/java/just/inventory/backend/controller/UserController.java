package just.inventory.backend.controller;

import just.inventory.backend.model.User;
import just.inventory.backend.model.Role;
import just.inventory.backend.model.Office;
import just.inventory.backend.repository.UserRepository;
import just.inventory.backend.repository.RoleRepository;
import just.inventory.backend.repository.OfficeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private OfficeRepository officeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> ResponseEntity.ok(user))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/admins")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<UserSummaryResponse>> getOfficeAdmins() {
        List<UserSummaryResponse> admins = userRepository.findAll().stream()
            .filter(user -> user.getRole() != null && "ADMIN".equals(user.getRole().getName()))
            .map(UserSummaryResponse::fromUser)
            .toList();

        return ResponseEntity.ok(admins);
    }

    @PostMapping("/admins")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createOfficeAdmin(@RequestBody CreateOfficeAdminRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            return ResponseEntity.badRequest().body("Username is required");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body("Password is required");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        if (request.getFullName() == null || request.getFullName().isBlank()) {
            return ResponseEntity.badRequest().body("Full name is required");
        }

        if (request.getOfficeId() == null) {
            return ResponseEntity.badRequest().body("Office ID is required");
        }

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        Role adminRole = roleRepository.findByName("ADMIN")
            .orElseThrow(() -> new RuntimeException("Admin role not found"));
        Office office = officeRepository.findById(request.getOfficeId())
            .orElseThrow(() -> new RuntimeException("Office not found"));

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail().trim());
        user.setFullName(request.getFullName().trim());
        user.setRole(adminRole);
        user.setOffice(office);

        User savedUser = userRepository.save(user);
        return ResponseEntity.status(201).body(UserSummaryResponse.fromUser(savedUser));
    }

    public static class CreateOfficeAdminRequest {
        private String username;
        private String password;
        private String email;
        private String fullName;
        private Long officeId;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public Long getOfficeId() {
            return officeId;
        }

        public void setOfficeId(Long officeId) {
            this.officeId = officeId;
        }
    }

    public record UserSummaryResponse(
        Long id,
        String username,
        String email,
        String name,
        String role,
        Long officeId,
        String officeName
    ) {
        public static UserSummaryResponse fromUser(User user) {
            Office office = user.getOffice();
            return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole() != null ? user.getRole().getName() : null,
                office != null ? office.getId() : null,
                office != null ? office.getName() : null
            );
        }
    }
}