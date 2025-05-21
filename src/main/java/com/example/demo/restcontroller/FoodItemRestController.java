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
            @RequestParam(required = false) Double maxPrice) {
        try {
            List<FoodItem> foods = foodItemService.getAvailableFoods(name, minPrice, maxPrice);
            if (foods.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(foods);
            }
            return ResponseEntity.ok(foods);
        } catch (Exception e) {
            logger.error("Error fetching food items: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping(value = "/add", consumes = {"multipart/form-data"})
    public ResponseEntity<?> addFood(
            @RequestPart(value = "name") String name,
            @RequestPart(value = "description", required = false) String description,
            @RequestPart(value = "price") String price,
            @RequestPart(value = "available") String available,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        logger.info("Received add food request: name={}, description={}, price={}, available={}, image={}",
                name, description, price, available, image != null ? image.getOriginalFilename() : "null");

        // Map individual fields to FoodItemDto
        FoodItemDto foodDto = new FoodItemDto();
        foodDto.setName(name);
        foodDto.setDescription(description);

        // Parse price
        Double priceValue;
        try {
            priceValue = Double.parseDouble(price);
        } catch (NumberFormatException e) {
            logger.warn("Invalid price format: {}", price);
            return ResponseEntity.badRequest().body("Price must be a valid number");
        }
        foodDto.setPrice(priceValue);

        // Parse available
        Boolean availableValue;
        try {
            availableValue = Boolean.parseBoolean(available);
        } catch (Exception e) {
            logger.warn("Invalid available format: {}", available);
            return ResponseEntity.badRequest().body("Available must be a valid boolean (true/false)");
        }
        foodDto.setAvailable(availableValue);

        // Validate FoodItemDto
        Set<ConstraintViolation<FoodItemDto>> violations = validator.validate(foodDto);
        if (!violations.isEmpty()) {
            logger.warn("Validation errors: {}", violations);
            return ResponseEntity.badRequest()
                    .body("Invalid food data: " + violations);
        }

        try {
            String imagePath = null;
            if (image != null && !image.isEmpty()) {
                imagePath = fileStorageService.storeFile(image);
                logger.info("Image uploaded: {}", imagePath);
            }
            FoodItem savedFood = foodItemService.saveFood(foodDto, imagePath);

            // Map back to DTO for response with imagePath
            FoodItemDto responseDto = new FoodItemDto();
            responseDto.setName(savedFood.getName());
            responseDto.setDescription(savedFood.getDescription());
            responseDto.setPrice(savedFood.getPrice());
            responseDto.setAvailable(savedFood.getAvailable());
            responseDto.setImagePath(savedFood.getImagePath());
            return ResponseEntity.ok(responseDto);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid input: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error adding food item: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to add food item: " + e.getMessage());
        }
    }
}