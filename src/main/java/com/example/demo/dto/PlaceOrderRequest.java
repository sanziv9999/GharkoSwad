package com.example.demo.dto;

public class PlaceOrderRequest {
    private Long userId;
    private Long foodItemId;
    private Integer quantity = 1; // Default value

    // Getters and setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getFoodItemId() {
        return foodItemId;
    }

    public void setFoodItemId(Long foodItemId) {
        this.foodItemId = foodItemId;
    }

    public Integer getQuantity() {
        return quantity != null ? quantity : 1; // Ensure null quantity defaults to 1
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}