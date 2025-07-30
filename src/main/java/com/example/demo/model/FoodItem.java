package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "food_items")
public class FoodItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private Double price;

    @NotNull(message = "Original price is required")
    @Positive(message = "Original price must be positive")
    private Double originalPrice; // To store the pre-discount price

    @NotNull(message = "Availability is required")
    private Boolean available;

    private String imagePath; // Stores the path to the image file on the server

    private String preparationTime; // e.g., "20-25 min"

    @ElementCollection(fetch = FetchType.EAGER)
    @NotEmpty(message = "Tags cannot be empty")
    private Set<String> tags; // e.g., "Bestseller", "Spicy"

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "100.0", inclusive = true)
    private Double discountPercentage; // e.g., 20.0 for 20% off

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private User user; // Reference to the user who added this food item

    // Constructors
    public FoodItem() {
        this.available = false;
        this.tags = new HashSet<>();
        this.discountPercentage = 0.0;
        this.price = 0.0;
        this.originalPrice = 0.0;
        this.imagePath = "";
        this.preparationTime = "";
    }

    public FoodItem(String name, String description, Double price, Double originalPrice, Boolean available, String imagePath,
                    String preparationTime, Set<String> tags, Double discountPercentage, User user) {
        this.name = name;
        this.description = description != null ? description : "";
        this.originalPrice = originalPrice != null && originalPrice > 0 ? originalPrice : 0.0;
        this.available = available != null ? available : false;
        this.imagePath = imagePath != null ? imagePath : "";
        this.preparationTime = preparationTime != null ? preparationTime : "";
        this.tags = tags != null && !tags.isEmpty() ? new HashSet<>(tags) : new HashSet<>();
        this.discountPercentage = discountPercentage != null && discountPercentage >= 0 && discountPercentage <= 100 ? discountPercentage : 0.0;
        this.user = user;
        calculatePrice();
    }

    // Method to calculate price
    private void calculatePrice() {
        if (originalPrice != null && originalPrice > 0) {
            if (discountPercentage != null && discountPercentage >= 0 && discountPercentage <= 100) {
                this.price = originalPrice * (1 - discountPercentage / 100);
            } else {
                this.price = originalPrice; // No discount applied
            }
        } else {
            this.price = 0.0; // Fallback if originalPrice is invalid
        }
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
        if (price != null && price > 0) {
            this.price = price; // Manual override
        }
    }

    public Double getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(Double originalPrice) {
        if (originalPrice != null && originalPrice > 0) {
            this.originalPrice = originalPrice;
            calculatePrice();
        }
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
        return tags != null ? tags : new HashSet<>();
    }

    public void setTags(Set<String> tags) {
        this.tags = tags != null && !tags.isEmpty() ? new HashSet<>(tags) : new HashSet<>();
    }

    public Double getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(Double discountPercentage) {
        if (discountPercentage != null && discountPercentage >= 0 && discountPercentage <= 100) {
            this.discountPercentage = discountPercentage;
            calculatePrice();
        }
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @Override
    public String toString() {
        return "FoodItem{" +
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
                ", user=" + (user != null ? user.getId() : null) +
                '}';
    }
}