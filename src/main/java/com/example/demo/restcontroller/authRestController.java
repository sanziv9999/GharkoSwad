package com.example.demo.restcontroller;

import com.example.demo.dto.EmailRequestDto;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.OtpVerificationRequest;
import com.example.demo.dto.ResetPasswordRequestDto;
import com.example.demo.model.Otp;
import com.example.demo.model.PendingUser;
import com.example.demo.model.User;
import com.example.demo.repository.OtpRepository;
import com.example.demo.repository.PendingUserRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.EmailService;
import com.example.demo.service.JwtService;
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

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<String> initiateRegistration(@Valid @RequestBody User user, BindingResult result) {
        if (result.hasErrors()) {
            return ResponseEntity.badRequest().body("Invalid input: " + result.getAllErrors());
        }

        Optional<User> existingUser = userRepo.findByEmail(user.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists! Try a new one.");
        }

        Optional<PendingUser> pendingUserOptional = pendingUserRepo.findByEmail(user.getEmail());
        if (pendingUserOptional.isPresent()) {
            pendingUserRepo.deleteByEmail(user.getEmail());
        }

        PendingUser pendingUser = new PendingUser(
            user.getEmail(),
            user.getUsername(),
            DigestUtils.sha3_256Hex(user.getPassword()),
            user.getLocation(),
            user.getPhoneNumber()
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to send OTP email: " + e.getMessage());
        }

        return ResponseEntity.ok("OTP sent to " + user.getEmail());
    }

    @PostMapping("/verify-otp")
    @Transactional
    public ResponseEntity<String> verifyOtpAndRegister(@Valid @RequestBody OtpVerificationRequest request, BindingResult result) {
        if (result.hasErrors()) {
            return ResponseEntity.badRequest().body("Invalid input: " + result.getAllErrors());
        }

        Optional<Otp> otpOptional = otpRepo.findByEmailAndOtpCode(request.getEmail(), request.getOtpCode());
        if (!otpOptional.isPresent()) {
            return ResponseEntity.badRequest().body("Invalid OTP or email.");
        }

        Otp otp = otpOptional.get();
        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            otpRepo.deleteByEmail(request.getEmail());
            return ResponseEntity.badRequest().body("OTP has expired.");
        }

        Optional<PendingUser> pendingUserOptional = pendingUserRepo.findByEmail(request.getEmail());
        if (!pendingUserOptional.isPresent()) {
            return ResponseEntity.badRequest().body("No pending registration found for this email.");
        }

        PendingUser pendingUser = pendingUserOptional.get();

        Optional<User> existingUser = userRepo.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists! Try a new one.");
        }

        User user = new User();
        user.setEmail(pendingUser.getEmail());
        user.setUsername(pendingUser.getUsername());
        user.setPassword(pendingUser.getPassword());
        user.setLocation(pendingUser.getLocation());
        user.setPhoneNumber(pendingUser.getPhoneNumber());
        userRepo.save(user);

        otpRepo.deleteByEmail(request.getEmail());
        pendingUserRepo.deleteByEmail(request.getEmail());

        String token = jwtService.generateToken(user.getEmail());

        return ResponseEntity.ok("Registration successful. Token: " + token);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest.getEmail() == null || loginRequest.getPassword() == null) {
            return ResponseEntity.badRequest().body("Email and password are required.");
        }

        Optional<User> userOptional = userRepo.findByEmail(loginRequest.getEmail());
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password.");
        }

        User user = userOptional.get();
        String hashedPassword = DigestUtils.sha3_256Hex(loginRequest.getPassword());
        if (!user.getPassword().equals(hashedPassword)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password.");
        }

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok("Login successful. Token: " + token);
    }

    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<String> forgotPassword(@RequestBody EmailRequestDto emailRequest) {
        if (emailRequest.getEmail() == null) {
            return ResponseEntity.badRequest().body("Email is required.");
        }

        Optional<User> userOptional = userRepo.findByEmail(emailRequest.getEmail());
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Email not found.");
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to send OTP email: " + e.getMessage());
        }

        return ResponseEntity.ok("OTP sent to " + emailRequest.getEmail());
    }

    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequestDto request, BindingResult result) {
        if (result.hasErrors()) {
            return ResponseEntity.badRequest().body("Invalid input: " + result.getAllErrors());
        }

        Optional<Otp> otpOptional = otpRepo.findByEmailAndOtpCode(request.getEmail(), request.getOtpCode());
        if (!otpOptional.isPresent()) {
            return ResponseEntity.badRequest().body("Invalid OTP or email.");
        }

        Otp otp = otpOptional.get();
        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            otpRepo.deleteByEmail(request.getEmail());
            return ResponseEntity.badRequest().body("OTP has expired.");
        }

        Optional<User> userOptional = userRepo.findByEmail(request.getEmail());
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Email not found.");
        }

        User user = userOptional.get();
        user.setPassword(DigestUtils.sha3_256Hex(request.getNewPassword()));
        userRepo.save(user);

        otpRepo.deleteByEmail(request.getEmail());

        return ResponseEntity.ok("Password reset successful.");
    }

    @PatchMapping("/edit/users/{id}")
    @Transactional
    public ResponseEntity<String> editUser(@PathVariable Long id, @Valid @RequestBody User user, BindingResult result) {
        if (result.hasErrors()) {
            return ResponseEntity.badRequest().body("Invalid input: " + result.getAllErrors());
        }

        Optional<User> userOptional = userRepo.findById(id);
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found.");
        }

        User existingUser = userOptional.get();
        existingUser.setEmail(user.getEmail());
        existingUser.setUsername(user.getUsername());
        existingUser.setPassword(DigestUtils.sha3_256Hex(user.getPassword()));
        existingUser.setLocation(user.getLocation());
        existingUser.setPhoneNumber(user.getPhoneNumber());
        userRepo.save(existingUser);

        return ResponseEntity.ok("User updated successfully.");
    }

    @DeleteMapping("/delete/users/{id}")
    @Transactional
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        Optional<User> userOptional = userRepo.findById(id);
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found.");
        }

        userRepo.deleteById(id);
        return ResponseEntity.ok("User deleted successfully.");
    }

    @GetMapping("/test")
    public String getTest() {
        return "test api";
    }
}