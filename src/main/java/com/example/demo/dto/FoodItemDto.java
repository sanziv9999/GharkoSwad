package com.example.demo.dto;

import jakarta.validation.constraints.*;

import java.util.HashSet;
import java.util.Set;

public class FoodItemDto {
    private Long id; // Matches FoodItem.id

    @NotNull(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    private String description;

    // Price is optional and can be calculated from originalPrice and discountPercentage
    private Double price;

    @NotNull(message = "Original price is required")
    @Positive(message = "Original price must be positive")
    private Double originalPrice;

    @NotNull(message = "Availability is required")
    private Boolean available;

    private String imagePath;

    private String preparationTime;

    @NotEmpty(message = "Tags cannot be empty")
    private Set<String> tags;

    @DecimalMin(value = "0.0", message = "Discount percentage must be at least 0")
    @DecimalMax(value = "100.0", message = "Discount percentage must not exceed 100")
    private Double discountPercentage;

    // New field for userId to represent the User association
    private Long userId;

    // No-args constructor with default values
    public FoodItemDto() {
        this.available = false;
        this.tags = new HashSet<>();
        this.discountPercentage = 0.0;
        this.imagePath = "";
        this.preparationTime = "";
    }

    // All-args constructor
    public FoodItemDto(Long id, String name, String description, Double price, Double originalPrice, Boolean available,
                       String imagePath, String preparationTime, Set<String> tags, Double discountPercentage, Long userId) {
        this.id = id;
        this.name = name;
        this.description = description != null ? description : "";
        this.price = price; // Can be null if calculated
        this.originalPrice = originalPrice != null && originalPrice > 0 ? originalPrice : null; // Enforce @NotNull via validation
        this.available = available != null ? available : false;
        this.imagePath = imagePath != null ? imagePath : "";
        this.preparationTime = preparationTime != null ? preparationTime : "";
        this.tags = tags != null && !tags.isEmpty() ? new HashSet<>(tags) : new HashSet<>();
        this.discountPercentage = discountPercentage != null && discountPercentage >= 0 && discountPercentage <= 100 ? discountPercentage : 0.0;
        this.userId = userId;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description != null ? description : "";
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price; // No validation, calculated if null
    }

    public Double getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(Double originalPrice) {
        this.originalPrice = originalPrice != null && originalPrice > 0 ? originalPrice : null; // Enforce @NotNull via validation
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available != null ? available : false;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath != null ? imagePath : "";
    }

    public String getPreparationTime() {
        return preparationTime;
    }

    public void setPreparationTime(String preparationTime) {
        this.preparationTime = preparationTime != null ? preparationTime : "";
    }

    public Set<String> getTags() {
        return tags != null ? new HashSet<>(tags) : new HashSet<>(); // Defensive copy
    }

    public void setTags(Set<String> tags) {
        this.tags = tags != null && !tags.isEmpty() ? new HashSet<>(tags) : new HashSet<>();
    }

    public Double getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(Double discountPercentage) {
        this.discountPercentage = discountPercentage != null && discountPercentage >= 0 && discountPercentage <= 100 ? discountPercentage : 0.0;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    @Override
    public String toString() {
        return "FoodItemDto{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", price=" + price +
                ", originalPrice=" + originalPrice +
                ", available=" + available +
                ", imagePath='" + imagePath + '\'' +
                ", preparationTime='" + preparationTime + '\'' +
                ", tags=" + tags +
                ", discountPercentage=" + discountPercentage +
                ", userId=" + userId +
                '}';
    }
}