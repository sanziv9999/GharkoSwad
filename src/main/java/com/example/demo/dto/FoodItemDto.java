package com.example.demo.dto;

import jakarta.validation.constraints.*;

import java.util.HashSet;
import java.util.Set;

public class FoodItemDto {
    @NotNull(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    private String description;

    // Price is optional as it can be calculated from originalPrice and discountPercentage
    private Double price;

    @Positive(message = "Original price must be positive if provided")
    private Double originalPrice;

    @NotNull(message = "Availability is required")
    private Boolean available;

    private String imagePath;

    private String preparationTime;

    private Set<String> tags;

    @DecimalMin(value = "0.0", message = "Discount percentage must be at least 0")
    @DecimalMax(value = "100.0", message = "Discount percentage must not exceed 100")
    private Double discountPercentage;

    // New field for userId to represent the User association
    private Long userId;

    // No-args constructor
    public FoodItemDto() {
    }

    // All-args constructor
    public FoodItemDto(String name, String description, Double price, Double originalPrice, Boolean available,
                       String imagePath, String preparationTime, Set<String> tags, Double discountPercentage, Long userId) {
        this.name = name;
        this.description = description;
        this.price = price; // Can be null if calculated
        this.originalPrice = originalPrice;
        this.available = available;
        this.imagePath = imagePath;
        this.preparationTime = preparationTime;
        this.tags = tags != null ? new HashSet<>(tags) : null; // Defensive copy
        this.discountPercentage = discountPercentage;
        this.userId = userId;
    }

    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; } // No validation, as it can be calculated
    public Double getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(Double originalPrice) { this.originalPrice = originalPrice; }
    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }
    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }
    public String getPreparationTime() { return preparationTime; }
    public void setPreparationTime(String preparationTime) { this.preparationTime = preparationTime; }
    public Set<String> getTags() { return tags; }
    public void setTags(Set<String> tags) { this.tags = tags != null ? new HashSet<>(tags) : null; } // Defensive copy
    public Double getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(Double discountPercentage) { this.discountPercentage = discountPercentage; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}