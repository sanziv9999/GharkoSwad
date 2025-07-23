package com.example.demo.restcontroller;

import com.example.demo.dto.UserDto;
import com.example.demo.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}