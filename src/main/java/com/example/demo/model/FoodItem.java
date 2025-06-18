package com.example.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.HashSet;
import java.util.Set;

@Entity
public class FoodItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    private String description;

    @NotNull
    @Positive
    private Double price;

    @NotNull
    private Double originalPrice; // To store the pre-discount price

    @NotNull
    private Boolean available;

    private String imagePath; // Stores the path to the image file on the server

    private String preparationTime; // e.g., "20-25 min"

    @ElementCollection
    private Set<String> tags; // e.g., "Bestseller", "Spicy"

    private Double discountPercentage; // e.g., 20.0 for 20% off

    // Constructors
    public FoodItem() {
        this.price = 0.0; // Default value, will be recalculated
        this.originalPrice = 0.0; // Default value
        this.available = false; // Default value
        this.tags = new HashSet<>(); // Default value
    }

    public FoodItem(String name, String description, Double price, Double originalPrice, Boolean available, String imagePath,
                    String preparationTime, Set<String> tags, Double discountPercentage) {
        this.name = name;
        this.description = description;
        this.originalPrice = originalPrice != null ? originalPrice : 0.0;
        this.available = available != null ? available : false;
        this.imagePath = imagePath != null ? imagePath : "";
        this.preparationTime = preparationTime != null ? preparationTime : "";
        this.tags = tags != null ? new HashSet<>(tags) : new HashSet<>();
        this.discountPercentage = discountPercentage != null ? discountPercentage : 0.0;
        calculatePrice(); // Calculate price based on originalPrice and discountPercentage
    }

    // Method to calculate price
    private void calculatePrice() {
        if (originalPrice != null && discountPercentage != null) {
            this.price = originalPrice * (1 - discountPercentage / 100);
        } else if (price == null || price <= 0) {
            this.price = originalPrice != null ? originalPrice : 0.0; // Fallback to originalPrice if no discount
        }
        // Ensure price meets @Positive constraint (handled by validation if invalid)
    }

    // Getters and Setters with price recalculation
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
        this.price = price != null && price > 0 ? price : this.price; // Only update if valid
        // Note: Manual price setting overrides calculation
    }

    public Double getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(Double originalPrice) {
        this.originalPrice = originalPrice != null && originalPrice > 0 ? originalPrice : this.originalPrice;
        calculatePrice(); // Recalculate price when originalPrice changes
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
        return tags;
    }

    public void setTags(Set<String> tags) {
        this.tags = tags != null ? new HashSet<>(tags) : new HashSet<>();
    }

    public Double getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(Double discountPercentage) {
        this.discountPercentage = discountPercentage != null && discountPercentage >= 0 && discountPercentage <= 100 ? discountPercentage : this.discountPercentage;
        calculatePrice(); // Recalculate price when discountPercentage changes
    }
}