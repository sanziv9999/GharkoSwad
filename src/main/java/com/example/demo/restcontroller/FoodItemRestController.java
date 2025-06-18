package com.example.demo.restcontroller;

import com.example.demo.dto.FoodItemDto;
import com.example.demo.model.FoodItem;
import com.example.demo.service.FoodItemService;
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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/food")
public class FoodItemRestController {

    private static final Logger logger = LoggerFactory.getLogger(FoodItemRestController.class);

    @Autowired
    private FoodItemService foodItemService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private Validator validator;

    @GetMapping("/list")
    public ResponseEntity<List<FoodItem>> getAvailableFoods(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Set<String> tags,
            @RequestParam(required = false) String preparationTime) {
        try {
            List<FoodItem> foods = foodItemService.searchFoods(true, name, minPrice, maxPrice, tags, preparationTime);
            if (foods.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(foods);
            }
            return ResponseEntity.ok(foods);
        } catch (Exception e) {
            logger.error("Error fetching available food items: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping(value = "/add", consumes = {"multipart/form-data"})
    public ResponseEntity<?> addFood(
            @RequestParam(value = "name") String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "price", required = false) String price,
            @RequestParam(value = "originalPrice", required = false) String originalPrice,
            @RequestParam(value = "available") String available,
            @RequestParam(value = "preparationTime", required = false) String preparationTime,
            @RequestParam(value = "tags", required = false) Set<String> tags,
            @RequestParam(value = "discountPercentage", required = false) String discountPercentage,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        
        logger.info("Received add food request: name={}, description={}, price={}, originalPrice={}, available={}, " +
                "preparationTime={}, tags={}, discountPercentage={}, image={}",
                name, description, price, originalPrice, available, preparationTime, tags, discountPercentage,
                image != null ? image.getOriginalFilename() : "null");

        // Create FoodItem instance
        FoodItem foodItem = new FoodItem();
        foodItem.setName(name);
        foodItem.setDescription(description != null ? description : "");
        if (price != null) foodItem.setPrice(parseDouble(price, "Price"));
        if (originalPrice != null) foodItem.setOriginalPrice(parseDouble(originalPrice, "Original price", true));
        foodItem.setAvailable(parseBoolean(available, "Available"));
        foodItem.setPreparationTime(preparationTime != null ? preparationTime : "");
        foodItem.setTags(tags != null ? new HashSet<>(tags) : new HashSet<>());
        if (discountPercentage != null) foodItem.setDiscountPercentage(parseDiscountPercentage(discountPercentage));

        // Validate FoodItem
        Set<ConstraintViolation<FoodItem>> violations = validator.validate(foodItem);
        if (!violations.isEmpty()) {
            String errorMessage = violations.stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .reduce((a, b) -> a + "; " + b).orElse("Validation failed");
            logger.warn("Validation errors: {}", violations);
            return ResponseEntity.badRequest().body(errorMessage);
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

            // Map back to DTO for response
            FoodItemDto responseDto = new FoodItemDto();
            mapFoodToDto(savedFood, responseDto);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid input during image upload: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            logger.error("IO error during image upload: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload image: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error adding food item: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to add food item: " + e.getMessage());
        }
    }

    @PatchMapping(value = "/update/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateFood(
            @PathVariable Long id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "price", required = false) String price,
            @RequestParam(value = "originalPrice", required = false) String originalPrice,
            @RequestParam(value = "available", required = false) String available,
            @RequestParam(value = "preparationTime", required = false) String preparationTime,
            @RequestParam(value = "tags", required = false) Set<String> tags,
            @RequestParam(value = "discountPercentage", required = false) String discountPercentage,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        
        logger.info("Received update food request for id {}: name={}, description={}, price={}, originalPrice={}, available={}, " +
                "preparationTime={}, tags={}, discountPercentage={}, image={}",
                id, name, description, price, originalPrice, available, preparationTime, tags, discountPercentage,
                image != null ? image.getOriginalFilename() : "null");

        // Fetch existing food item
        FoodItem existingFood = foodItemService.findById(id);
        if (existingFood == null) {
            logger.warn("Food item with id {} not found", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Food item not found");
        }

        // Update existing FoodItem
        if (name != null) existingFood.setName(name);
        if (description != null) existingFood.setDescription(description);
        if (price != null) existingFood.setPrice(parseDouble(price, "Price"));
        if (originalPrice != null) existingFood.setOriginalPrice(parseDouble(originalPrice, "Original price", true));
        if (available != null) existingFood.setAvailable(parseBoolean(available, "Available"));
        if (preparationTime != null) existingFood.setPreparationTime(preparationTime);
        if (tags != null) existingFood.setTags(new HashSet<>(tags));
        if (discountPercentage != null) existingFood.setDiscountPercentage(parseDiscountPercentage(discountPercentage));

        // Validate FoodItem
        Set<ConstraintViolation<FoodItem>> violations = validator.validate(existingFood);
        if (!violations.isEmpty()) {
            String errorMessage = violations.stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .reduce((a, b) -> a + "; " + b).orElse("Validation failed");
            logger.warn("Validation errors: {}", violations);
            return ResponseEntity.badRequest().body(errorMessage);
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

            // Map back to DTO for response
            FoodItemDto responseDto = new FoodItemDto();
            mapFoodToDto(updatedFood, responseDto);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid input during image upload: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            logger.error("IO error during image upload: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload image: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error updating food item: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update food item: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteFood(@PathVariable Long id) {
        logger.info("Received delete food request for id {}", id);

        // Fetch existing food item
        FoodItem existingFood = foodItemService.findById(id);
        if (existingFood == null) {
            logger.warn("Food item with id {} not found", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Food item not found");
        }

        try {
            // Delete associated image if it exists
            if (existingFood.getImagePath() != null) {
                Path imagePath = Paths.get("uploads/images/" + existingFood.getImagePath().replace("/images/", ""));
                try {
                    Files.deleteIfExists(imagePath);
                    logger.info("Image deleted: {}", existingFood.getImagePath());
                } catch (IOException e) {
                    logger.warn("Failed to delete image: {}", e.getMessage(), e);
                }
            }
            // Delete food item from database
            foodItemService.deleteById(id);
            logger.info("Food item with id {} deleted", id);
            return ResponseEntity.ok().body("Food item deleted successfully");
        } catch (Exception e) {
            logger.error("Error deleting food item: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete food item: " + e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<FoodItem>> searchFoods(
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String startsWith,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Set<String> tags,
            @RequestParam(required = false) String preparationTime) {
        logger.info("Received search request: available={}, startsWith={}, minPrice={}, maxPrice={}, tags={}, preparationTime={}",
                available, startsWith, minPrice, maxPrice, tags, preparationTime);

        try {
            List<FoodItem> foods;
            if (available == null && startsWith == null && minPrice == null && maxPrice == null && tags == null && preparationTime == null) {
                foods = foodItemService.getAllFoods(); // Fetch all if no filters
            } else {
                foods = foodItemService.searchFoods(available, startsWith, minPrice, maxPrice, tags, preparationTime);
            }
            if (foods.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(foods);
            }
            return ResponseEntity.ok(foods);
        } catch (Exception e) {
            logger.error("Error searching food items: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/tag")
    public ResponseEntity<List<FoodItem>> findByTag(
            @RequestParam String tag) {
        try {
            List<FoodItem> foods = foodItemService.findByTag(tag);
            if (foods.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(foods);
            }
            return ResponseEntity.ok(foods);
        } catch (Exception e) {
            logger.error("Error fetching food items by tag: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/sort/price")
    public ResponseEntity<List<FoodItem>> getAllByPriceAsc() {
        try {
            List<FoodItem> foods = foodItemService.getAllByPriceAsc();
            if (foods.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(foods);
            }
            return ResponseEntity.ok(foods);
        } catch (Exception e) {
            logger.error("Error sorting food items by price: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/sort/discount")
    public ResponseEntity<List<FoodItem>> getAllByDiscountPercentageDesc() {
        try {
            List<FoodItem> foods = foodItemService.getAllByDiscountPercentageDesc();
            if (foods.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(foods);
            }
            return ResponseEntity.ok(foods);
        } catch (Exception e) {
            logger.error("Error sorting food items by discount: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
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
        dto.setName(food.getName() != null ? food.getName() : "");
        dto.setDescription(food.getDescription() != null ? food.getDescription() : "");
        dto.setPrice(food.getPrice());
        dto.setOriginalPrice(food.getOriginalPrice());
        dto.setAvailable(food.getAvailable());
        dto.setImagePath(food.getImagePath() != null ? food.getImagePath() : "");
        dto.setPreparationTime(food.getPreparationTime() != null ? food.getPreparationTime() : "");
        dto.setTags(food.getTags() != null ? new HashSet<>(food.getTags()) : new HashSet<>());
        dto.setDiscountPercentage(food.getDiscountPercentage());
    }
}