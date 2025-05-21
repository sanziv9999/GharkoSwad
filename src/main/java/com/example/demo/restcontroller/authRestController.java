package com.example.demo.restcontroller;

import com.example.demo.dto.UserDto;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.OtpVerificationRequest;
import com.example.demo.model.Otp;
import com.example.demo.model.User;
import com.example.demo.repository.OtpRepository;
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
    private EmailService emailService;

    @Autowired
    private JwtService jwtService;

    // Existing registration endpoint
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

        // Generate 6-digit OTP
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(5);

        // Save OTP to database
        otpRepo.deleteByEmail(user.getEmail()); // Clear any existing OTPs
        Otp otp = new Otp(user.getEmail(), otpCode, now, expiresAt);
        otpRepo.save(otp);

        // Send OTP email
        try {
            emailService.sendOtpEmail(user.getEmail(), otpCode);
        } catch (MessagingException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to send OTP email: " + e.getMessage());
        }

        return ResponseEntity.ok("OTP sent to " + user.getEmail());
    }

    // Existing OTP verification endpoint
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

        UserDto userDto = request.getUser();
        if (!userDto.getEmail().equals(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email mismatch.");
        }

        Optional<User> existingUser = userRepo.findByEmail(userDto.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists! Try a new one.");
        }

        // Map UserDto to User entity
        User user = new User();
        user.setEmail(userDto.getEmail());
        user.setUsername(userDto.getUsername());
        user.setPassword(DigestUtils.sha3_256Hex(userDto.getPassword()));
        user.setLocation(userDto.getLocation());
        user.setPhoneNumber(userDto.getPhoneNumber());

        // Save user
        userRepo.save(user);

        // Delete OTP
        otpRepo.deleteByEmail(user.getEmail());

        // Generate JWT
        String token = jwtService.generateToken(user.getEmail());

        return ResponseEntity.ok("Registration successful. Token: " + token);
    }

    // New login endpoint
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

        // Generate JWT
        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok("Login successful. Token: " + token);
    }

    
    
    @GetMapping("/test")
    public String getTest() {
        return "test api";
    }
}