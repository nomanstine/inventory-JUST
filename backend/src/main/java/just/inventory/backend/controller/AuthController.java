package just.inventory.backend.controller;

import just.inventory.backend.config.JwtUtil;
import just.inventory.backend.model.User;
import just.inventory.backend.repository.UserRepository;
import just.inventory.backend.repository.RoleRepository;
import just.inventory.backend.repository.OfficeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private OfficeRepository officeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<User> existingUser = userRepository.findByUsername(loginRequest.getUsername());
        if (existingUser.isPresent() && !Boolean.TRUE.equals(existingUser.get().getActive())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Your account is deactivated. Please contact your administrator.");
        }

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());
        final String jwt = jwtUtil.generateToken(userDetails);
        
        // Get the full user entity
        User user = userRepository.findByUsername(loginRequest.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        
        // Create user object with all necessary fields
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId().toString());
        userInfo.put("username", user.getUsername());
        userInfo.put("email", user.getEmail());
        userInfo.put("name", user.getFullName());
        userInfo.put("role", user.getRole().getName());
        userInfo.put("permissions", userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .toList());
        userInfo.put("officeId", user.getOffice().getId().toString());
        userInfo.put("officeName", user.getOffice().getName());
        userInfo.put("avatarUrl", user.getAvatarUrl());
        userInfo.put("isActive", Boolean.TRUE.equals(user.getActive()));
        
        response.put("user", userInfo);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body("Public registration is disabled. A super admin must create office admin accounts.");
    }

    public static class LoginRequest {
        private String username;
        private String password;

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
    }

    public static class RegisterRequest {
        private String username;
        private String password;
        private String email;
        private String fullName;
        private Long roleId;
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

        public Long getRoleId() {
            return roleId;
        }

        public void setRoleId(Long roleId) {
            this.roleId = roleId;
        }

        public Long getOfficeId() {
            return officeId;
        }

        public void setOfficeId(Long officeId) {
            this.officeId = officeId;
        }
    }
}
