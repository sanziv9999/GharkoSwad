
package com.example.demo.restcontroller;

import com.example.demo.dto.EmailRequestDto;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.OtpVerificationRequest;
import com.example.demo.dto.ResetPasswordRequestDto;
import com.example.demo.model.Otp;
import com.example.demo.model.PendingUser;
import com.example.demo.model.User;
import com.example.demo.model.UserProfile;
import com.example.demo.repository.OtpRepository;
import com.example.demo.repository.PendingUserRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.EmailService;
import com.example.demo.service.JwtService;
import com.example.demo.service.UserService;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api")
public class AuthRestController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private OtpRepository otpRepo;

    @Autowired
    private PendingUserRepository pendingUserRepo;

    @Autowired
    private EmailService emailService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService; // Add UserService dependency

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<Map<String, Object>> initiateRegistration(@Valid @RequestBody User user, BindingResult result) {
        Map<String, Object> response = new HashMap<>();
        if (result.hasErrors()) {
            response.put("status", "error");
            response.put("message", "Invalid input: " + result.getAllErrors());
            return ResponseEntity.badRequest().body(response);
        }

        Optional<User> existingUser = userRepo.findByEmail(user.getEmail());
        if (existingUser.isPresent()) {
            response.put("status", "error");
            response.put("message", "Email already exists! Try a new one.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        Optional<PendingUser> pendingUserOptional = pendingUserRepo.findByEmail(user.getEmail());
        if (pendingUserOptional.isPresent()) {
            pendingUserRepo.deleteByEmail(user.getEmail());
        }

        String role = "USER";
        if (user.getRole() != null) {
            switch (user.getRole().toUpperCase()) {
                case "CHEF":
                    role = "CHEF";
                    break;
                case "DELIVERY":
                    role = "DELIVERY";
                    break;
                case "USER":
                    role = "USER";
                    break;
                default:
                    response.put("status", "error");
                    response.put("message", "Invalid role. Allowed roles are USER, CHEF, or DELIVERY.");
                    return ResponseEntity.badRequest().body(response);
            }
        }

        PendingUser pendingUser = new PendingUser(
            user.getEmail(),
            user.getUsername(),
            DigestUtils.sha3_256Hex(user.getPassword()),
            user.getLocation(),
            user.getPhoneNumber(),
            role
        );
        pendingUserRepo.save(pendingUser);

        String otpCode = String.format("%06d", new Random().nextInt(999999));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(5);

        otpRepo.deleteByEmail(user.getEmail());
        Otp otp = new Otp(user.getEmail(), otpCode, now, expiresAt);
        otpRepo.save(otp);

        try {
            emailService.sendOtpEmail(user.getEmail(), otpCode);
        } catch (MessagingException e) {
            response.put("status", "error");
            response.put("message", "Failed to send OTP email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }

        response.put("status", "success");
        response.put("message", "OTP sent to " + user.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    @Transactional
    public ResponseEntity<Map<String, Object>> verifyOtpAndRegister(@Valid @RequestBody OtpVerificationRequest request, BindingResult result) {
        Map<String, Object> response = new HashMap<>();
        if (result.hasErrors()) {
            response.put("status", "error");
            response.put("message", "Invalid input: " + result.getAllErrors());
            return ResponseEntity.badRequest().body(response);
        }

        Optional<Otp> otpOptional = otpRepo.findByEmailAndOtpCode(request.getEmail(), request.getOtpCode());
        if (!otpOptional.isPresent()) {
            response.put("status", "error");
            response.put("message", "Invalid OTP or email.");
            return ResponseEntity.badRequest().body(response);
        }

        Otp otp = otpOptional.get();
        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            otpRepo.deleteByEmail(request.getEmail());
            response.put("status", "error");
            response.put("message", "OTP has expired.");
            return ResponseEntity.badRequest().body(response);
        }

        Optional<PendingUser> pendingUserOptional = pendingUserRepo.findByEmail(request.getEmail());
        if (!pendingUserOptional.isPresent()) {
            response.put("status", "error");
            response.put("message", "No pending registration found for this email.");
            return ResponseEntity.badRequest().body(response);
        }

        PendingUser pendingUser = pendingUserOptional.get();

        Optional<User> existingUser = userRepo.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            response.put("status", "error");
            response.put("message", "Email already exists! Try a new one.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        User user = new User();
        user.setEmail(pendingUser.getEmail());
        user.setUsername(pendingUser.getUsername());
        user.setPassword(pendingUser.getPassword());
        user.setLocation(pendingUser.getLocation());
        user.setPhoneNumber(pendingUser.getPhoneNumber());
        user.setRole(pendingUser.getRole());
        userRepo.save(user);

        otpRepo.deleteByEmail(request.getEmail());
        pendingUserRepo.deleteByEmail(request.getEmail());

        String token = jwtService.generateToken(user.getEmail());
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "email", user.getEmail(),
            "role", user.getRole()
        ));

        response.put("status", "success");
        response.put("message", "Registration successful");
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest loginRequest) {
        Map<String, Object> response = new HashMap<>();
        if (loginRequest.getEmail() == null || loginRequest.getPassword() == null) {
            response.put("status", "error");
            response.put("message", "Email and password are required.");
            return ResponseEntity.badRequest().body(response);
        }

        Optional<User> userOptional = userRepo.findByEmail(loginRequest.getEmail());
        if (!userOptional.isPresent()) {
            response.put("status", "error");
            response.put("message", "Invalid email or password.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        User user = userOptional.get();
        String hashedPassword = DigestUtils.sha3_256Hex(loginRequest.getPassword());
        if (!user.getPassword().equals(hashedPassword)) {
            response.put("status", "error");
            response.put("message", "Invalid email or password.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        String token = jwtService.generateToken(user.getEmail());
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("username", user.getUsername());
        userData.put("email", user.getEmail());
        userData.put("role", user.getRole());
        userData.put("phone", user.getPhoneNumber());
        userData.put("location", user.getLocation());

        // Fetch UserProfile
        UserProfile profile = userService.findUserProfileByUserId(user.getId());
        userData.put("profilePicture", profile != null ? profile.getProfilePicture() : null);
        userData.put("coordinate", profile != null ? profile.getCoordinate() : null);
        userData.put("description", profile != null ? profile.getDescription() : null);

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", userData);

        response.put("status", "success");
        response.put("message", "Login successful");
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody EmailRequestDto emailRequest) {
        Map<String, Object> response = new HashMap<>();
        if (emailRequest.getEmail() == null) {
            response.put("status", "error");
            response.put("message", "Email is required.");
            return ResponseEntity.badRequest().body(response);
        }

        Optional<User> userOptional = userRepo.findByEmail(emailRequest.getEmail());
        if (!userOptional.isPresent()) {
            response.put("status", "error");
            response.put("message", "Email not found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        String otpCode = String.format("%06d", new Random().nextInt(999999));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(5);

        otpRepo.deleteByEmail(emailRequest.getEmail());
        Otp otp = new Otp(emailRequest.getEmail(), otpCode, now, expiresAt);
        otpRepo.save(otp);

        try {
            emailService.sendOtpEmail(emailRequest.getEmail(), otpCode);
        } catch (MessagingException e) {
            response.put("status", "error");
            response.put("message", "Failed to send OTP email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }

        response.put("status", "success");
        response.put("message", "OTP sent to " + emailRequest.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ResetPasswordRequestDto request, BindingResult result) {
        Map<String, Object> response = new HashMap<>();
        if (result.hasErrors()) {
            response.put("status", "error");
            response.put("message", "Invalid input: " + result.getAllErrors());
            return ResponseEntity.badRequest().body(response);
        }

        Optional<Otp> otpOptional = otpRepo.findByEmailAndOtpCode(request.getEmail(), request.getOtpCode());
        if (!otpOptional.isPresent()) {
            response.put("status", "error");
            response.put("message", "Invalid OTP or email.");
            return ResponseEntity.badRequest().body(response);
        }

        Otp otp = otpOptional.get();
        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            otpRepo.deleteByEmail(request.getEmail());
            response.put("status", "error");
            response.put("message", "OTP has expired.");
            return ResponseEntity.badRequest().body(response);
        }

        Optional<User> userOptional = userRepo.findByEmail(request.getEmail());
        if (!userOptional.isPresent()) {
            response.put("status", "error");
            response.put("message", "Email not found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        User user = userOptional.get();
        user.setPassword(DigestUtils.sha3_256Hex(request.getNewPassword()));
        userRepo.save(user);

        otpRepo.deleteByEmail(request.getEmail());

        response.put("status", "success");
        response.put("message", "Password reset successful");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/edit/users/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> editUser(@PathVariable Long id, @Valid @RequestBody User user, BindingResult result) {
        Map<String, Object> response = new HashMap<>();
        if (result.hasErrors()) {
            response.put("status", "error");
            response.put("message", "Invalid input: " + result.getAllErrors());
            return ResponseEntity.badRequest().body(response);
        }

        Optional<User> userOptional = userRepo.findById(id);
        if (!userOptional.isPresent()) {
            response.put("status", "error");
            response.put("message", "User not found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        User existingUser = userOptional.get();
        existingUser.setEmail(user.getEmail());
        existingUser.setUsername(user.getUsername());
        existingUser.setPassword(DigestUtils.sha3_256Hex(user.getPassword()));
        existingUser.setLocation(user.getLocation());
        existingUser.setPhoneNumber(user.getPhoneNumber());
        String role = user.getRole() != null && user.getRole().equals("CHEF") ? "CHEF" : "USER";
        existingUser.setRole(role);
        userRepo.save(existingUser);

        response.put("status", "success");
        response.put("message", "User updated successfully");
        response.put("data", Map.of(
            "id", existingUser.getId(),
            "username", existingUser.getUsername(),
            "email", existingUser.getEmail(),
            "role", existingUser.getRole()
        ));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete/users/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        Optional<User> userOptional = userRepo.findById(id);
        if (!userOptional.isPresent()) {
            response.put("status", "error");
            response.put("message", "User not found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        userRepo.deleteById(id);
        response.put("status", "success");
        response.put("message", "User deleted successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> getTest() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Test API successful");
        return ResponseEntity.ok(response);
    }
}
