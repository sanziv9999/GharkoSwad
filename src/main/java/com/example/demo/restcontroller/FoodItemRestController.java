package com.example.demo.restcontroller;

import com.example.demo.dto.FoodItemDto;
import com.example.demo.model.FoodItem;
import com.example.demo.model.User;
import com.example.demo.service.FoodItemService;
import com.example.demo.service.UserService;
import com.example.demo.service.FileStorageService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/food")
public class FoodItemRestController {

    private static final Logger logger = LoggerFactory.getLogger(FoodItemRestController.class);

    @Autowired
    private FoodItemService foodItemService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UserService userService;

    @Autowired
    private Validator validator;

    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getAvailableFoods(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String tags, // Accept as string for comma-separated values
            @RequestParam(required = false) String preparationTime) {
        Map<String, Object> response = new HashMap<>();
        try {
            Set<String> tagsSet = null;
            if (tags != null && !tags.trim().isEmpty()) {
                tagsSet = Arrays.stream(tags.split(","))
                        .map(String::trim)
                        .filter(tag -> !tag.isEmpty())
                        .collect(Collectors.toCollection(HashSet::new));
            }

            List<FoodItem> foods = foodItemService.searchFoods(true, name, minPrice, maxPrice, tagsSet, preparationTime);

            if (foods.isEmpty()) {
                response.put("status", "success");
                response.put("message", "No available food items found");
                response.put("data", new ArrayList<>());
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
            }

            List<FoodItemDto> foodDtos = foods.stream()
                    .map(food -> {
                        FoodItemDto dto = new FoodItemDto();
                        mapFoodToDto(food, dto);
                        return dto;
                    })
                    .collect(Collectors.toList());

            response.put("status", "success");
            response.put("message", "Food items retrieved successfully");
            response.put("data", foodDtos);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching available food items: {}", e.getMessage());
            response.put("status", "error");
            response.put("message", "Failed to fetch food items: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/list/by-user")
    public ResponseEntity<Map<String, Object>> getFoodsByUserId(
            @RequestParam Long userId,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) String preparationTime) {
        Map<String, Object> response = new HashMap<>();
        try {
            User user = userService.findById(userId);
            if (user == null) {
                logger.warn("User with id {} not found", userId);
                response.put("status", "error");
                response.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            Set<String> tagsSet = tags != null ? new HashSet<>(List.of(tags.split(","))) : null;
            List<FoodItem> foods = foodItemService.searchFoodsByUserId(userId, available, name, minPrice, maxPrice, tagsSet, preparationTime);
            if (foods.isEmpty()) {
                response.put("status", "success");
                response.put("message", "No food items found for this user");
                response.put("data", new ArrayList<>());
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
            }

            List<FoodItemDto> foodDtos = foods.stream()
                    .map(food -> {
                        FoodItemDto dto = new FoodItemDto();
                        mapFoodToDto(food, dto);
                        return dto;
                    })
                    .collect(Collectors.toList());

            response.put("status", "success");
            response.put("message", "Food items retrieved successfully");
            response.put("data", foodDtos);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching food items for user id {}: {}", userId, e.getMessage());
            response.put("status", "error");
            response.put("message", "Failed to fetch food items: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping(value = "/add", consumes = {"multipart/form-data"})
    public ResponseEntity<Map<String, Object>> addFood(
            @RequestParam(value = "name") String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "price", required = false) String price,
            @RequestParam(value = "originalPrice", required = false) String originalPrice,
            @RequestParam(value = "available") String available,
            @RequestParam(value = "preparationTime", required = false) String preparationTime,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "discountPercentage", required = false) String discountPercentage,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "userId") Long userId) {
        Map<String, Object> response = new HashMap<>();
        logger.info("Received add food request: name={}, description={}, price={}, originalPrice={}, available={}, " +
                "preparationTime={}, tags={}, discountPercentage={}, image={}, userId={}",
                name, description, price, originalPrice, available, preparationTime, tags, discountPercentage,
                image != null ? image.getOriginalFilename() : "null", userId);

        User user = userService.findById(userId);
        if (user == null) {
            logger.warn("User with id {} not found", userId);
            response.put("status", "error");
            response.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        FoodItem foodItem = new FoodItem();
        foodItem.setName(name);
        foodItem.setDescription(description != null ? description : "");
        if (price != null) foodItem.setPrice(parseDouble(price, "Price"));
        if (originalPrice != null) foodItem.setOriginalPrice(parseDouble(originalPrice, "Original price", true));
        foodItem.setAvailable(parseBoolean(available, "Available"));
        foodItem.setPreparationTime(preparationTime != null ? preparationTime : "");
        if (tags != null && !tags.trim().isEmpty()) {
            foodItem.setTags(Arrays.stream(tags.split(","))
                    .map(String::trim)
                    .filter(tag -> !tag.isEmpty())
                    .collect(Collectors.toCollection(HashSet::new)));
        } else {
            foodItem.setTags(new HashSet<>());
        }
        if (discountPercentage != null) foodItem.setDiscountPercentage(parseDiscountPercentage(discountPercentage));
        foodItem.setUser(user);

        Set<ConstraintViolation<FoodItem>> violations = validator.validate(foodItem);
        if (!violations.isEmpty()) {
            String errorMessage = violations.stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .reduce((a, b) -> a + "; " + b).orElse("Validation failed");
            logger.warn("Validation errors: {}", violations);
            response.put("status", "error");
            response.put("message", errorMessage);
            return ResponseEntity.badRequest().body(response);
        }

        try {
            String imagePath = "";
            if (image != null && !image.isEmpty()) {
                imagePath = fileStorageService.storeFile(image);
                logger.info("Image successfully saved with path: {}", imagePath);
            } else {
                logger.warn("No valid image provided for upload");
            }
            foodItem.setImagePath(imagePath);
            FoodItem savedFood = foodItemService.saveFood(foodItem);

            FoodItemDto responseDto = new FoodItemDto();
            mapFoodToDto(savedFood, responseDto);
            response.put("status", "success");
            response.put("message", "Food item added successfully");
            response.put("data", responseDto);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid input during image upload: {}", e.getMessage());
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (IOException e) {
            logger.error("IO error during image upload: {}", e.getMessage(), e);
            response.put("status", "error");
            response.put("message", "Failed to upload image: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            logger.error("Error adding food item: {}", e.getMessage(), e);
            response.put("status", "error");
            response.put("message", "Failed to add food item: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PatchMapping(value = "/update/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<Map<String, Object>> updateFood(
            @PathVariable Long id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "price", required = false) String price,
            @RequestParam(value = "originalPrice", required = false) String originalPrice,
            @RequestParam(value = "available", required = false) String available,
            @RequestParam(value = "preparationTime", required = false) String preparationTime,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "discountPercentage", required = false) String discountPercentage,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "userId", required = false) Long userId) {
        Map<String, Object> response = new HashMap<>();
        logger.info("Received update food request for id {}: name={}, description={}, price={}, originalPrice={}, available={}, " +
                "preparationTime={}, tags={}, discountPercentage={}, image={}, userId={}",
                id, name, description, price, originalPrice, available, preparationTime, tags, discountPercentage,
                image != null ? image.getOriginalFilename() : "null", userId);

        FoodItem existingFood = foodItemService.findById(id);
        if (existingFood == null) {
            logger.warn("Food item with id {} not found", id);
            response.put("status", "error");
            response.put("message", "Food item not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        if (name != null) existingFood.setName(name);
        if (description != null) existingFood.setDescription(description);
        if (price != null) existingFood.setPrice(parseDouble(price, "Price"));
        if (originalPrice != null) existingFood.setOriginalPrice(parseDouble(originalPrice, "Original price", true));
        if (available != null) existingFood.setAvailable(parseBoolean(available, "Available"));
        if (preparationTime != null) existingFood.setPreparationTime(preparationTime);
        if (tags != null && !tags.trim().isEmpty()) {
            existingFood.setTags(Arrays.stream(tags.split(","))
                    .map(String::trim)
                    .filter(tag -> !tag.isEmpty())
                    .collect(Collectors.toCollection(HashSet::new)));
        }
        if (discountPercentage != null) existingFood.setDiscountPercentage(parseDiscountPercentage(discountPercentage));
        if (userId != null) {
            User user = userService.findById(userId);
            if (user == null) {
                logger.warn("User with id {} not found", userId);
                response.put("status", "error");
                response.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            existingFood.setUser(user);
        }

        Set<ConstraintViolation<FoodItem>> violations = validator.validate(existingFood);
        if (!violations.isEmpty()) {
            String errorMessage = violations.stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .reduce((a, b) -> a + "; " + b).orElse("Validation failed");
            logger.warn("Validation errors: {}", violations);
            response.put("status", "error");
            response.put("message", errorMessage);
            return ResponseEntity.badRequest().body(response);
        }

        try {
            String newImagePath = existingFood.getImagePath() != null ? existingFood.getImagePath() : "";
            if (image != null && !image.isEmpty()) {
                if (existingFood.getImagePath() != null) {
                    Path oldImagePath = Paths.get("uploads/images/" + existingFood.getImagePath().replace("/images/", ""));
                    try {
                        Files.deleteIfExists(oldImagePath);
                        logger.info("Old image deleted: {}", existingFood.getImagePath());
                    } catch (IOException e) {
                        logger.warn("Failed to delete old image: {}", e.getMessage(), e);
                    }
                }
                newImagePath = fileStorageService.storeFile(image);
                logger.info("New image saved with path: {}", newImagePath);
            } else {
                logger.info("No new image provided for update");
            }
            existingFood.setImagePath(newImagePath);
            FoodItem updatedFood = foodItemService.saveFood(existingFood);

            FoodItemDto responseDto = new FoodItemDto();
            mapFoodToDto(updatedFood, responseDto);
            response.put("status", "success");
            response.put("message", "Food item updated successfully");
            response.put("data", responseDto);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid input during image upload: {}", e.getMessage());
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (IOException e) {
            logger.error("IO error during image upload: {}", e.getMessage(), e);
            response.put("status", "error");
            response.put("message", "Failed to upload image: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            logger.error("Error updating food item: {}", e.getMessage(), e);
            response.put("status", "error");
            response.put("message", "Failed to update food item: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Map<String, Object>> deleteFood(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        logger.info("Received delete food request for id {}", id);

        FoodItem existingFood = foodItemService.findById(id);
        if (existingFood == null) {
            logger.warn("Food item with id {} not found", id);
            response.put("status", "error");
            response.put("message", "Food item not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        try {
            if (existingFood.getImagePath() != null) {
                Path imagePath = Paths.get("uploads/images/" + existingFood.getImagePath().replace("/images/", ""));
                try {
                    Files.deleteIfExists(imagePath);
                    logger.info("Image deleted: {}", existingFood.getImagePath());
                } catch (IOException e) {
                    logger.warn("Failed to delete image: {}", e.getMessage(), e);
                }
            }
            foodItemService.deleteById(id);
            logger.info("Food item with id {} deleted", id);
            response.put("status", "success");
            response.put("message", "Food item deleted successfully");
            response.put("data", null); // No data needed for delete
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error deleting food item: {}", e.getMessage(), e);
            response.put("status", "error");
            response.put("message", "Failed to delete food item: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchFoods(
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String startsWith,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) String preparationTime) {
        Map<String, Object> response = new HashMap<>();
        logger.info("Received search request: available={}, startsWith={}, minPrice={}, maxPrice={}, tags={}, preparationTime={}",
                available, startsWith, minPrice, maxPrice, tags, preparationTime);

        try {
            Set<String> tagsSet = tags != null ? new HashSet<>(List.of(tags.split(","))) : null;
            List<FoodItem> foods;
            if (available == null && startsWith == null && minPrice == null && maxPrice == null && tags == null && preparationTime == null) {
                foods = foodItemService.getAllFoods();
            } else {
                foods = foodItemService.searchFoods(available, startsWith, minPrice, maxPrice, tagsSet, preparationTime);
            }
            if (foods.isEmpty()) {
                response.put("status", "success");
                response.put("message", "No food items found");
                response.put("data", new ArrayList<>());
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
            }

            List<FoodItemDto> foodDtos = foods.stream()
                    .map(food -> {
                        FoodItemDto dto = new FoodItemDto();
                        mapFoodToDto(food, dto);
                        return dto;
                    })
                    .collect(Collectors.toList());

            response.put("status", "success");
            response.put("message", "Food items retrieved successfully");
            response.put("data", foodDtos);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error searching food items: {}", e.getMessage());
            response.put("status", "error");
            response.put("message", "Failed to search food items: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/tag")
    public ResponseEntity<Map<String, Object>> findByTag(
            @RequestParam String tag) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<FoodItem> foods = foodItemService.findByTag(tag);
            if (foods.isEmpty()) {
                response.put("status", "success");
                response.put("message", "No food items found with tag: " + tag);
                response.put("data", new ArrayList<>());
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
            }

            List<FoodItemDto> foodDtos = foods.stream()
                    .map(food -> {
                        FoodItemDto dto = new FoodItemDto();
                        mapFoodToDto(food, dto);
                        return dto;
                    })
                    .collect(Collectors.toList());

            response.put("status", "success");
            response.put("message", "Food items retrieved successfully");
            response.put("data", foodDtos);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching food items by tag: {}", e.getMessage());
            response.put("status", "error");
            response.put("message", "Failed to fetch food items by tag: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/sort/price")
    public ResponseEntity<Map<String, Object>> getAllByPriceAsc() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<FoodItem> foods = foodItemService.getAllByPriceAsc();
            if (foods.isEmpty()) {
                response.put("status", "success");
                response.put("message", "No food items found");
                response.put("data", new ArrayList<>());
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
            }

            List<FoodItemDto> foodDtos = foods.stream()
                    .map(food -> {
                        FoodItemDto dto = new FoodItemDto();
                        mapFoodToDto(food, dto);
                        return dto;
                    })
                    .collect(Collectors.toList());

            response.put("status", "success");
            response.put("message", "Food items retrieved successfully");
            response.put("data", foodDtos);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error sorting food items by price: {}", e.getMessage());
            response.put("status", "error");
            response.put("message", "Failed to sort food items by price: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/sort/discount")
    public ResponseEntity<Map<String, Object>> getAllByDiscountPercentageDesc() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<FoodItem> foods = foodItemService.getAllByDiscountPercentageDesc();
            if (foods.isEmpty()) {
                response.put("status", "success");
                response.put("message", "No food items found");
                response.put("data", new ArrayList<>());
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
            }

            List<FoodItemDto> foodDtos = foods.stream()
                    .map(food -> {
                        FoodItemDto dto = new FoodItemDto();
                        mapFoodToDto(food, dto);
                        return dto;
                    })
                    .collect(Collectors.toList());

            response.put("status", "success");
            response.put("message", "Food items retrieved successfully");
            response.put("data", foodDtos);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error sorting food items by discount: {}", e.getMessage());
            response.put("status", "error");
            response.put("message", "Failed to sort food items by discount: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Helper methods
    private Double parseDouble(String value, String fieldName) {
        if (value == null) return null;
        try {
            Double result = Double.parseDouble(value);
            if (result <= 0) {
                throw new NumberFormatException();
            }
            return result;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(fieldName + " must be a valid number and positive");
        }
    }

    private Double parseDouble(String value, String fieldName, boolean positive) {
        if (value == null) return null;
        try {
            Double result = Double.parseDouble(value);
            if (positive && result <= 0) {
                throw new NumberFormatException();
            }
            return result;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(fieldName + " must be a valid number" + (positive ? " and positive" : ""));
        }
    }

    private Double parseDiscountPercentage(String value) {
        if (value == null) return null;
        try {
            Double result = Double.parseDouble(value);
            if (result < 0 || result > 100) {
                throw new NumberFormatException();
            }
            return result;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Discount percentage must be between 0 and 100");
        }
    }

    private Boolean parseBoolean(String value, String fieldName) {
        if (value == null) return null;
        try {
            return Boolean.parseBoolean(value);
        } catch (Exception e) {
            throw new IllegalArgumentException(fieldName + " must be a valid boolean (true/false)");
        }
    }

    private void mapFoodToDto(FoodItem food, FoodItemDto dto) {
        dto.setId(food.getId()); // Ensure id is mapped
        dto.setName(food.getName() != null ? food.getName() : "");
        dto.setDescription(food.getDescription() != null ? food.getDescription() : "");
        dto.setPrice(food.getPrice());
        dto.setOriginalPrice(food.getOriginalPrice());
        dto.setAvailable(food.getAvailable());
        dto.setImagePath(food.getImagePath() != null ? food.getImagePath() : "");
        dto.setPreparationTime(food.getPreparationTime() != null ? food.getPreparationTime() : "");
        dto.setTags(food.getTags() != null ? new HashSet<>(food.getTags()) : new HashSet<>());
        dto.setDiscountPercentage(food.getDiscountPercentage());
        if (food.getUser() != null) {
            dto.setUserId(food.getUser().getId());
        }
    }
}