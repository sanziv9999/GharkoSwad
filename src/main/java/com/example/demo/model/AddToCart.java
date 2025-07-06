package com.example.demo.model;

import jakarta.persistence.*;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Entity representing an item added to the user's cart.
 * Maps to the 'add_to_cart' table in the database.
 */
@Entity
@Table(name = "add_to_cart")
public class AddToCart implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "food_id", nullable = false)
    private Long foodId; // Reference to FoodItem entity

    @Column(name = "user_id", nullable = false)
    private Long userId; // Reference to User entity

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Default constructor (required by JPA)
    public AddToCart() {}

    /**
     * Constructor with required fields.
     * @param foodId The ID of the food item
     * @param userId The ID of the user
     * @param quantity The quantity of the food item (must be positive)
     * @throws IllegalArgumentException if quantity is negative
     */
    public AddToCart(Long foodId, Long userId, Integer quantity) {
        if (foodId == null || userId == null || quantity == null) {
            throw new IllegalArgumentException("foodId, userId, and quantity cannot be null");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        this.foodId = foodId;
        this.userId = userId;
        this.quantity = quantity;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFoodId() {
        return foodId;
    }

    public void setFoodId(Long foodId) {
        if (foodId == null) {
            throw new IllegalArgumentException("foodId cannot be null");
        }
        this.foodId = foodId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId cannot be null");
        }
        this.userId = userId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        this.quantity = quantity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // Remove setter to make createdAt immutable after persistence
    // public void setCreatedAt(LocalDateTime createdAt) {
    //     this.createdAt = createdAt;
    // }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Lifecycle methods with time zone consideration
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now(); // Adjust with ZoneId if needed, e.g., ZoneId.of("Asia/Kolkata")
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now(); // Adjust with ZoneId if needed
    }

    @Override
    public String toString() {
        return "AddToCart{" +
                "id=" + id +
                ", foodId=" + foodId +
                ", userId=" + userId +
                ", quantity=" + quantity +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}