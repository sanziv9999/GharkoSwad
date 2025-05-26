package com.example.demo.dto;

public class CancelOrderRequest {
    private Long foodOrderId;
    private Long userId;

    // Getters and setters
    public Long getFoodOrderId() {
        return foodOrderId;
    }

    public void setFoodOrderId(Long foodOrderId) {
        this.foodOrderId = foodOrderId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}