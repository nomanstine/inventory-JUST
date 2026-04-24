package just.inventory.backend.controller;

import just.inventory.backend.model.User;
import just.inventory.backend.model.Role;
import just.inventory.backend.model.Office;
import just.inventory.backend.repository.UserRepository;
import just.inventory.backend.repository.RoleRepository;
import just.inventory.backend.repository.OfficeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> ResponseEntity.ok(user))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me/profile")
    public ResponseEntity<?> updateMyProfile(@RequestBody UpdateProfileRequest request, Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        if (request.getFullName() == null || request.getFullName().isBlank()) {
            return ResponseEntity.badRequest().body("Full name is required");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        boolean emailAlreadyExists = userRepository.findByEmail(request.getEmail().trim())
            .filter(existing -> !existing.getId().equals(user.getId()))
            .isPresent();

        if (emailAlreadyExists) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        user.setFullName(request.getFullName().trim());
        user.setEmail(request.getEmail().trim());
        user.setAvatarUrl(request.getAvatarUrl() == null || request.getAvatarUrl().isBlank() ? null : request.getAvatarUrl().trim());

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(UserProfileResponse.fromUser(savedUser, authentication));
    }

    @GetMapping("/admins")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<List<UserSummaryResponse>> getOfficeAdmins(Authentication authentication) {
        User currentUser = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        boolean isSuperAdmin = hasRole(currentUser, "SUPER_ADMIN");
        Long currentOfficeId = currentUser.getOffice() != null ? currentUser.getOffice().getId() : null;

        List<UserSummaryResponse> admins = userRepository.findAll().stream()
            .filter(user -> user.getRole() != null && "ADMIN".equals(normalizeRoleName(user.getRole().getName())))
            .filter(user -> isSuperAdmin || (user.getOffice() != null && currentOfficeId != null && currentOfficeId.equals(user.getOffice().getId())))
            .map(UserSummaryResponse::fromUser)
            .toList();

        return ResponseEntity.ok(admins);
    }

    @GetMapping("/office-users")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<List<UserSummaryResponse>> getOfficeUsers(Authentication authentication) {
        User currentUser = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        boolean isSuperAdmin = hasRole(currentUser, "SUPER_ADMIN");
        Long currentOfficeId = currentUser.getOffice() != null ? currentUser.getOffice().getId() : null;

        List<UserSummaryResponse> officeUsers = userRepository.findAll().stream()
            .filter(user -> user.getRole() != null && "USER".equals(normalizeRoleName(user.getRole().getName())))
            .filter(user -> isSuperAdmin || (user.getOffice() != null && currentOfficeId != null && currentOfficeId.equals(user.getOffice().getId())))
            .map(UserSummaryResponse::fromUser)
            .toList();

        return ResponseEntity.ok(officeUsers);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id, Authentication authentication) {
        User currentUser = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        User targetUser = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Target user not found"));

        if (!canManageAccount(currentUser, targetUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You do not have permission to deactivate this account");
        }

        if (!Boolean.TRUE.equals(targetUser.getActive())) {
            return ResponseEntity.badRequest().body("User is already deactivated");
        }

        targetUser.setActive(false);
        User savedUser = userRepository.save(targetUser);
        return ResponseEntity.ok(UserSummaryResponse.fromUser(savedUser));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> activateUser(@PathVariable Long id, Authentication authentication) {
        User currentUser = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        User targetUser = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Target user not found"));

        if (!canManageAccount(currentUser, targetUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You do not have permission to activate this account");
        }

        if (Boolean.TRUE.equals(targetUser.getActive())) {
            return ResponseEntity.badRequest().body("User is already active");
        }

        targetUser.setActive(true);
        User savedUser = userRepository.save(targetUser);
        return ResponseEntity.ok(UserSummaryResponse.fromUser(savedUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        User currentUser = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        User targetUser = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Target user not found"));

        if (!canManageAccount(currentUser, targetUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You do not have permission to delete this account");
        }

        userRepository.delete(targetUser);
        return ResponseEntity.ok().body("User account deleted successfully");
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

        Office office = officeRepository.findById(request.getOfficeId())
            .orElseThrow(() -> new RuntimeException("Office not found"));

        Role adminRole = roleRepository.findByName("ADMIN")
            .orElseThrow(() -> new RuntimeException("Admin role not found"));

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

    @PostMapping("/office-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createOfficeUser(@RequestBody CreateOfficeUserRequest request, Authentication authentication) {
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

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        User currentUser = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        Long currentOfficeId = Optional.ofNullable(currentUser.getOffice())
            .map(Office::getId)
            .orElse(null);
        Long targetOfficeId = request.getOfficeId() != null ? request.getOfficeId() : currentOfficeId;

        if (targetOfficeId == null) {
            return ResponseEntity.badRequest().body("Office ID is required");
        }

        if (request.getOfficeId() != null && !request.getOfficeId().equals(currentOfficeId)) {
            return ResponseEntity.badRequest().body("Admins can only create users for their own office");
        }

        Office office = officeRepository.findById(targetOfficeId)
            .orElseThrow(() -> new RuntimeException("Office not found"));

        Role userRole = roleRepository.findByName("USER")
            .orElseThrow(() -> new RuntimeException("User role not found"));

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail().trim());
        user.setFullName(request.getFullName().trim());
        user.setRole(userRole);
        user.setOffice(office);

        User savedUser = userRepository.save(user);
        return ResponseEntity.status(201).body(UserSummaryResponse.fromUser(savedUser));
    }

    private boolean hasRole(User user, String roleName) {
        return Optional.ofNullable(user.getRole())
            .map(Role::getName)
            .map(this::normalizeRoleName)
            .map(roleName::equals)
            .orElse(false);
    }

    private boolean canManageAccount(User currentUser, User targetUser) {
        if (currentUser.getId().equals(targetUser.getId())) {
            return false;
        }

        String targetRole = Optional.ofNullable(targetUser.getRole())
            .map(Role::getName)
            .map(this::normalizeRoleName)
            .orElse("");

        if (hasRole(currentUser, "SUPER_ADMIN")) {
            return "ADMIN".equals(targetRole);
        }

        if (hasRole(currentUser, "ADMIN")) {
            Long currentOfficeId = Optional.ofNullable(currentUser.getOffice()).map(Office::getId).orElse(null);
            Long targetOfficeId = Optional.ofNullable(targetUser.getOffice()).map(Office::getId).orElse(null);
            return "USER".equals(targetRole)
                && currentOfficeId != null
                && currentOfficeId.equals(targetOfficeId);
        }

        return false;
    }

    private String normalizeRoleName(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return "";
        }

        return roleName.replaceFirst("^ROLE_", "").trim().toUpperCase();
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

    public static class CreateOfficeUserRequest {
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

    public static class UpdateProfileRequest {
        private String fullName;
        private String email;
        private String avatarUrl;

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getAvatarUrl() {
            return avatarUrl;
        }

        public void setAvatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
        }
    }

    public record UserProfileResponse(
        Long id,
        String username,
        String email,
        String name,
        String role,
        List<String> permissions,
        String officeId,
        String officeName,
        String avatarUrl
    ) {
        public static UserProfileResponse fromUser(User user, Authentication authentication) {
            Office office = user.getOffice();
            return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole() != null ? user.getRole().getName() : null,
                authentication.getAuthorities().stream().map(authority -> authority.getAuthority()).toList(),
                office != null ? office.getId().toString() : null,
                office != null ? office.getName() : null,
                user.getAvatarUrl()
            );
        }
    }

    public record UserSummaryResponse(
        Long id,
        String username,
        String email,
        String name,
        String role,
        Long officeId,
        String officeName,
        Boolean active
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
                office != null ? office.getName() : null,
                Boolean.TRUE.equals(user.getActive())
            );
        }
    }
}