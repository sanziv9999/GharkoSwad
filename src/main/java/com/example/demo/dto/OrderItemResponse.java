package com.example.demo.dto;

public class OrderItemResponse {
    private Long orderItemId; // Added orderItemId field
    private FoodItemDto foodItem;
    private Integer quantity;

    public OrderItemResponse() {
    }

    public OrderItemResponse(Long orderItemId, FoodItemDto foodItem, Integer quantity) {
        this.orderItemId = orderItemId;
        this.foodItem = foodItem;
        this.quantity = quantity != null ? quantity : 0;
    }

    public Long getOrderItemId() {
        return orderItemId;
    }

    public void setOrderItemId(Long orderItemId) {
        this.orderItemId = orderItemId;
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
                "orderItemId=" + orderItemId +
                ", foodItem=" + foodItem +
                ", quantity=" + quantity +
                '}';
    }
}