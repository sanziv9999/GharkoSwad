package com.example.demo.dto;

import com.example.demo.model.Order;
import com.example.demo.model.OrderStatus;
import com.example.demo.model.PaymentStatus;

import java.time.LocalDateTime;

public class OrderResponse {
    private Long id;
    private Long userId;
    private Long foodItemId;
    private String foodItemName;
    private Integer quantity;
    private Double amount; // Changed from BigDecimal to Double
    private String paymentMethod;
    private PaymentStatus paymentStatus;
    private OrderStatus status;
    private LocalDateTime orderDate;

    // Constructors
    public OrderResponse() {}

    public OrderResponse(Order order) {
        this.id = order.getId();
        this.userId = order.getUser().getId();
        this.foodItemId = order.getFoodItem().getId();
        this.foodItemName = order.getFoodItem().getName();
        this.quantity = order.getQuantity();
        this.amount = order.getPayment() != null ? order.getPayment().getAmount() : null;
        this.paymentMethod = order.getPayment() != null ? order.getPayment().getPaymentMethod() : null;
        this.paymentStatus = order.getPayment() != null ? order.getPayment().getStatus() : null;
        this.status = order.getStatus();
        this.orderDate = order.getOrderDate();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getFoodItemId() { return foodItemId; }
    public void setFoodItemId(Long foodItemId) { this.foodItemId = foodItemId; }
    public String getFoodItemName() { return foodItemName; }
    public void setFoodItemName(String foodItemName) { this.foodItemName = foodItemName; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
}