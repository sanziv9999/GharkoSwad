package com.example.demo.restcontroller;

import com.example.demo.dto.UserDto;
import com.example.demo.model.User;
import com.example.demo.model.UserProfile;
import com.example.demo.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserRestController {
    private static final Logger logger = LoggerFactory.getLogger(UserRestController.class);

    @Autowired
    private UserService userService;

    @GetMapping("/chefs")
    public ResponseEntity<Map<String, Object>> getChefs() {
        logger.info("Received request to fetch users with CHEF role");
        try {
            List<UserDto> chefs = userService.findUsersByRole("CHEF").stream()
                    .map(user -> {
                        UserDto dto = new UserDto();
                        dto.setId(user.getId());
                        dto.setEmail(user.getEmail());
                        dto.setUsername(user.getUsername());
                        dto.setLocation(user.getLocation());
                        dto.setPhoneNumber(user.getPhoneNumber());
                        dto.setRole(user.getRole());
                        UserProfile profile = userService.findUserProfileByUserId(user.getId());
                        if (profile != null) {
                            dto.setProfilePicture(profile.getProfilePicture());
                            dto.setCoordinate(profile.getCoordinate());
                            dto.setDescription(profile.getDescription());
                        }
                        return dto;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> responseBody = new HashMap<>();
            if (chefs.isEmpty()) {
                responseBody.put("data", chefs);
                responseBody.put("message", "No users found with CHEF role");
                responseBody.put("status", "success");
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(responseBody);
            }

            responseBody.put("data", chefs);
            responseBody.put("message", "Chefs retrieved successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException e) {
            logger.warn("Error fetching chefs: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error fetching chefs: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to fetch chefs: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping(value = "/{userId}/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> createUserProfile(
            @PathVariable Long userId,
            @RequestPart(name = "profilePicture", required = false) MultipartFile profilePicture,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "username", required = false) String username,
            @RequestParam(name = "location", required = false) String location,
            @RequestParam(name = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(name = "coordinate", required = false) String coordinate,
            @RequestParam(name = "description", required = false) String description) {
        logger.info("Received request to create profile for userId={}, profilePicture={}", userId, 
                    profilePicture != null ? profilePicture.getOriginalFilename() : "null");
        logger.debug("ProfilePicture state: isNull={}, isEmpty={}, size={}", 
                     profilePicture == null, profilePicture != null && profilePicture.isEmpty(), 
                     profilePicture != null ? profilePicture.getSize() : -1);
        try {
            UserProfile createdProfile = userService.createUserProfile(userId, profilePicture, email, username, location, phoneNumber, coordinate, description);
            User user = createdProfile.getUser();
            UserDto responseDto = new UserDto();
            responseDto.setId(user.getId());
            responseDto.setEmail(user.getEmail());
            responseDto.setUsername(user.getUsername());
            responseDto.setLocation(user.getLocation());
            responseDto.setPhoneNumber(user.getPhoneNumber());
            responseDto.setRole(user.getRole());
            responseDto.setProfilePicture(createdProfile.getProfilePicture());
            responseDto.setCoordinate(createdProfile.getCoordinate());
            responseDto.setDescription(createdProfile.getDescription());

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("data", responseDto);
            responseBody.put("message", "User profile created successfully");
            responseBody.put("status", "success");
            return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
        } catch (IllegalArgumentException e) {
            logger.warn("Error creating user profile: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (IOException e) {
            logger.error("Error processing file upload: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to process file upload: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error creating user profile: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to create user profile: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{userId}/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile(@PathVariable Long userId) {
        logger.info("Received request to fetch profile for userId={}", userId);
        try {
            User user = userService.findById(userId);
            UserProfile profile = userService.findUserProfileByUserId(userId);
            UserDto responseDto = new UserDto();
            responseDto.setId(user.getId());
            responseDto.setEmail(user.getEmail());
            responseDto.setUsername(user.getUsername());
            responseDto.setLocation(user.getLocation());
            responseDto.setPhoneNumber(user.getPhoneNumber());
            responseDto.setRole(user.getRole());
            if (profile != null) {
                responseDto.setProfilePicture(profile.getProfilePicture());
                responseDto.setCoordinate(profile.getCoordinate());
                responseDto.setDescription(profile.getDescription());
            }

            Map<String, Object> responseBody = new HashMap<>();
            if (profile == null) {
                responseBody.put("data", responseDto);
                responseBody.put("message", "No profile found for userId: " + userId);
                responseBody.put("status", "success");
                return ResponseEntity.status(HttpStatus.OK).body(responseBody);
            }

            responseBody.put("data", responseDto);
            responseBody.put("message", "User profile retrieved successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException e) {
            logger.warn("Error fetching user profile: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error fetching user profile: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to fetch user profile: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping(value = "/{userId}/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateUserProfile(
            @PathVariable Long userId,
            @RequestPart(name = "profilePicture", required = false) MultipartFile profilePicture,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "username", required = false) String username,
            @RequestParam(name = "location", required = false) String location,
            @RequestParam(name = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(name = "coordinate", required = false) String coordinate,
            @RequestParam(name = "description", required = false) String description) {
        logger.info("Received request to update profile for userId={}, profilePicture={}", userId, 
                    profilePicture != null ? profilePicture.getOriginalFilename() : "null");
        logger.debug("ProfilePicture state: isNull={}, isEmpty={}, size={}", 
                     profilePicture == null, profilePicture != null && profilePicture.isEmpty(), 
                     profilePicture != null ? profilePicture.getSize() : -1);
        try {
            UserProfile updatedProfile = userService.updateUserProfile(userId, profilePicture, email, username, location, phoneNumber, coordinate, description);
            User user = updatedProfile.getUser();
            UserDto responseDto = new UserDto();
            responseDto.setId(user.getId());
            responseDto.setEmail(user.getEmail());
            responseDto.setUsername(user.getUsername());
            responseDto.setLocation(user.getLocation());
            responseDto.setPhoneNumber(user.getPhoneNumber());
            responseDto.setRole(user.getRole());
            responseDto.setProfilePicture(updatedProfile.getProfilePicture());
            responseDto.setCoordinate(updatedProfile.getCoordinate());
            responseDto.setDescription(updatedProfile.getDescription());

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("data", responseDto);
            responseBody.put("message", "User profile updated successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException e) {
            logger.warn("Error updating user profile: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (IOException e) {
            logger.error("Error processing file upload: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to process file upload: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error updating user profile: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to update user profile: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{userId}/profile")
    public ResponseEntity<Map<String, Object>> deleteUserProfile(@PathVariable Long userId) {
        logger.info("Received request to delete profile for userId={}", userId);
        try {
            userService.deleteUserProfile(userId);
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("data", null);
            responseBody.put("message", "User profile deleted successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException e) {
            logger.warn("Error deleting user profile: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error deleting user profile: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to delete user profile: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}