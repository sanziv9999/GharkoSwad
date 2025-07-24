package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.model.UserProfile;
import com.example.demo.repository.UserProfileRepository;
import com.example.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    // Regular expression for coordinate format: "latitude, longitude" or "latitude,longitude"
    private static final Pattern COORDINATE_PATTERN = Pattern.compile("^-?\\d+\\.\\d+(, ?)-?\\d+\\.\\d+$");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private FileStorageService fileStorageService;

    public User findById(Long id) {
        logger.info("Fetching user with id={}", id);
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    public User findByUsername(String username) {
        logger.info("Fetching user with username={}", username);
        return userRepository.findByUsername(username);
    }

    @Transactional
    public User saveUser(User user) {
        logger.info("Saving user with email={}", user.getEmail());
        if (user.getRole() == null || user.getRole().isEmpty() || 
            (!user.getRole().equals("CHEF") && !user.getRole().equals("USER") && !user.getRole().equals("DELIVERY"))) {
            user.setRole("USER");
        }
        return userRepository.save(user);
    }

    public List<User> findUsersByRole(String role) {
        logger.info("Fetching users with role={}", role);
        if (role == null || role.trim().isEmpty()) {
            throw new IllegalArgumentException("Role is required");
        }
        return userRepository.findByRole(role.toUpperCase());
    }

    @Transactional
    public UserProfile createUserProfile(Long userId, MultipartFile profilePicture, String email, String username, 
                                        String location, String phoneNumber, String coordinate, String description) throws IOException {
        logger.info("Creating profile for user with id={}, profilePicture={}", userId, 
                    profilePicture != null ? profilePicture.getOriginalFilename() : "null");
        logger.debug("ProfilePicture state: isNull={}, isEmpty={}, size={}", 
                     profilePicture == null, profilePicture != null && profilePicture.isEmpty(), 
                     profilePicture != null ? profilePicture.getSize() : -1);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        UserProfile existingProfile = userProfileRepository.findByUserId(userId);
        if (existingProfile != null) {
            throw new IllegalArgumentException("User profile already exists for userId: " + userId);
        }

        UserProfile profile = new UserProfile();
        profile.setUser(user);

        String imagePath = "";
        if (profilePicture != null && !profilePicture.isEmpty()) {
            imagePath = fileStorageService.storeFile(profilePicture);
            logger.info("Image successfully saved with path: {}", imagePath);
        } else {
            logger.info("No image provided for upload");
        }
        profile.setProfilePicture(imagePath);

        if (email != null) user.setEmail(email);
        if (username != null) user.setUsername(username);
        if (location != null) user.setLocation(location);
        if (phoneNumber != null) user.setPhoneNumber(phoneNumber);
        if (coordinate != null) {
            validateCoordinate(coordinate);
            profile.setCoordinate(coordinate);
        }
        if (description != null) {
            profile.setDescription(description);
        }
        if ("CHEF".equals(user.getRole()) && (profile.getDescription() == null || profile.getDescription().trim().isEmpty())) {
            throw new IllegalArgumentException("Description is required for users with CHEF role");
        }

        userRepository.save(user);
        return userProfileRepository.save(profile);
    }

    public UserProfile findUserProfileByUserId(Long userId) {
        logger.info("Fetching user profile for userId={}", userId);
        return userProfileRepository.findByUserId(userId);
    }

    @Transactional
    public UserProfile updateUserProfile(Long userId, MultipartFile profilePicture, String email, String username, 
                                        String location, String phoneNumber, String coordinate, String description) throws IOException {
        logger.info("Updating profile for user with id={}, profilePicture={}", userId, 
                    profilePicture != null ? profilePicture.getOriginalFilename() : "null");
        logger.debug("ProfilePicture state: isNull={}, isEmpty={}, size={}", 
                     profilePicture == null, profilePicture != null && profilePicture.isEmpty(), 
                     profilePicture != null ? profilePicture.getSize() : -1);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Update user fields
        if (email != null) user.setEmail(email);
        if (username != null) user.setUsername(username);
        if (location != null) user.setLocation(location);
        if (phoneNumber != null) user.setPhoneNumber(phoneNumber);
        userRepository.save(user);

        UserProfile profile = userProfileRepository.findByUserId(userId);
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
        }

        // Handle profile picture update - only update if a new file is provided
        if (profilePicture != null && !profilePicture.isEmpty()) {
            // Delete old image if it exists
            if (profile.getProfilePicture() != null && !profile.getProfilePicture().isEmpty()) {
                try {
                    java.nio.file.Path oldImagePath = Paths.get("uploads/images/" + profile.getProfilePicture().replace("/images/", ""));
                    Files.deleteIfExists(oldImagePath);
                    logger.info("Old image deleted: {}", profile.getProfilePicture());
                } catch (IOException e) {
                    logger.warn("Failed to delete old image: {}", e.getMessage());
                }
            }
            
            // Store new image
            String newImagePath = fileStorageService.storeFile(profilePicture);
            profile.setProfilePicture(newImagePath);
            logger.info("New image saved with path: {}", newImagePath);
        } else {
            logger.info("No new image provided for update - keeping existing profile picture: {}", 
                       profile.getProfilePicture() != null ? profile.getProfilePicture() : "none");
            // Don't modify profile.getProfilePicture() - keep the existing value
        }

        // Update other profile fields
        if (coordinate != null) {
            validateCoordinate(coordinate);
            profile.setCoordinate(coordinate);
        }
        if (description != null) {
            profile.setDescription(description);
        }
        
        // Validation for CHEF role
        if ("CHEF".equals(user.getRole()) && (profile.getDescription() == null || profile.getDescription().trim().isEmpty())) {
            throw new IllegalArgumentException("Description is required for users with CHEF role");
        }

        return userProfileRepository.save(profile);
    }
    @Transactional
    public void deleteUserProfile(Long userId) {
        logger.info("Deleting user profile for userId={}", userId);
        UserProfile profile = userProfileRepository.findByUserId(userId);
        if (profile == null) {
            throw new IllegalArgumentException("User profile not found for userId: " + userId);
        }
        if (profile.getProfilePicture() != null) {
            try {
                java.nio.file.Path imagePath = Paths.get("uploads/images/" + profile.getProfilePicture().replace("/images/", ""));
                Files.deleteIfExists(imagePath);
                logger.info("Image deleted: {}", profile.getProfilePicture());
            } catch (IOException e) {
                logger.warn("Failed to delete image: {}", e.getMessage());
            }
        }
        userProfileRepository.delete(profile);
    }

    private void validateCoordinate(String coordinate) {
        if (coordinate == null || !COORDINATE_PATTERN.matcher(coordinate).matches()) {
            throw new IllegalArgumentException("Invalid coordinate format. Expected: 'latitude,longitude' or 'latitude, longitude' (e.g., '27.7172,85.3240' or '27.672956063330112, 85.31850913633565')");
        }
        try {
            String[] parts = coordinate.split(", ?");
            double latitude = Double.parseDouble(parts[0]);
            double longitude = Double.parseDouble(parts[1]);
            if (latitude < -90 || latitude > 90) {
                throw new IllegalArgumentException("Latitude must be between -90 and 90");
            }
            if (longitude < -180 || longitude > 180) {
                throw new IllegalArgumentException("Longitude must be between -180 and 180");
            }
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Coordinate values must be valid numbers");
        }
    }
}