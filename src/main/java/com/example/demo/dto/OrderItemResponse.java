package com.example.demo.dto;

public class OrderItemResponse {
    private FoodItemDto foodItem;
    private Integer quantity;

    public OrderItemResponse() {
    }

    public OrderItemResponse(FoodItemDto foodItem, Integer quantity) {
        this.foodItem = foodItem;
        this.quantity = quantity != null ? quantity : 0;
    }

    public FoodItemDto getFoodItem() {
        return foodItem;
    }

    public void setFoodItem(FoodItemDto foodItem) {
        this.foodItem = foodItem;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity != null ? quantity : 0;
    }

    @Override
    public String toString() {
        return "OrderItemResponse{" +
                "foodItem=" + foodItem +
                ", quantity=" + quantity +
                '}';
    }
}