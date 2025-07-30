package com.example.demo.dto;

import java.util.List;

public class PlaceOrderRequest {
    private Long userId;
    private List<Long> foodItemIds;
    private List<Integer> quantities;
    private Double amount;
    private String paymentMethod;
    private String specialInstructions;
    private String deliveryLocation;
    private String deliveryPhone;
    private String deliveryCoordinates;
    private String transactionUuid;

    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public List<Long> getFoodItemIds() { return foodItemIds; }
    public void setFoodItemIds(List<Long> foodItemIds) { this.foodItemIds = foodItemIds; }
    public List<Integer> getQuantities() { return quantities; }
    public void setQuantities(List<Integer> quantities) { this.quantities = quantities; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    public String getDeliveryLocation() { return deliveryLocation; }
    public void setDeliveryLocation(String deliveryLocation) { this.deliveryLocation = deliveryLocation; }
    public String getDeliveryPhone() { return deliveryPhone; }
    public void setDeliveryPhone(String deliveryPhone) { this.deliveryPhone = deliveryPhone; }
    public String getDeliveryCoordinates() { return deliveryCoordinates; }
    public void setDeliveryCoordinates(String deliveryCoordinates) { this.deliveryCoordinates = deliveryCoordinates; }
    public String getTransactionUuid() { return transactionUuid; }
    public void setTransactionUuid(String transactionUuid) { this.transactionUuid = transactionUuid; }
}