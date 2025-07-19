package com.example.demo.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class CancelOrderItemsRequest {
    @NotNull(message = "userId is required")
    private Long userId;

    @NotEmpty(message = "foodOrderItemIds cannot be empty")
    private List<Long> foodOrderItemIds;

    // Getters and setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<Long> getFoodOrderItemIds() {
        return foodOrderItemIds;
    }

    public void setFoodOrderItemIds(List<Long> foodOrderItemIds) {
        this.foodOrderItemIds = foodOrderItemIds;
    }
}