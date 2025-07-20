package com.example.demo.dto;

import java.util.List;

import com.example.demo.model.Order;

public class OrderResponse {
    private Long orderId;
    private Long userId;
    private UserDto user; // New field for user details
    private List<OrderItemResponse> orderItems;
    private Double amount;
    private String paymentMethod;
    private String paymentStatus;
    private String status;
    private String orderDate;
    private String deliveryLocation;
    private String deliveryPhone;
    private String deliveryCoordinates;
    private String transactionUuid;

    // Constructor
    public OrderResponse(Order order) {
        this.orderId = order.getId();
        this.userId = order.getUser() != null ? order.getUser().getId() : null;
        this.amount = order.getPayment() != null ? order.getPayment().getAmount() : null;
        this.paymentMethod = order.getPayment() != null ? order.getPayment().getPaymentMethod() : null;
        this.paymentStatus = order.getPayment() != null ? order.getPayment().getStatus().name() : null;
        this.status = order.getStatus();
        this.orderDate = order.getOrderDate() != null ? order.getOrderDate().toString() : null;
        this.deliveryLocation = order.getDeliveryLocation();
        this.deliveryPhone = order.getDeliveryPhone();
        this.deliveryCoordinates = order.getDeliveryCoordinates();
        this.transactionUuid = order.getPayment() != null ? order.getPayment().getTransactionId() : null;
    }

    // Getters and setters
    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public UserDto getUser() {
        return user;
    }

    public void setUser(UserDto DTO) {
        this.user = user;
    }

    public List<OrderItemResponse> getOrderItems() {
        return orderItems;
    }

    public void setOrderItems(List<OrderItemResponse> orderItems) {
        this.orderItems = orderItems;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(String orderDate) {
        this.orderDate = orderDate;
    }

    public String getDeliveryLocation() {
        return deliveryLocation;
    }

    public void setDeliveryLocation(String deliveryLocation) {
        this.deliveryLocation = deliveryLocation;
    }

    public String getDeliveryPhone() {
        return deliveryPhone;
    }

    public void setDeliveryPhone(String deliveryPhone) {
        this.deliveryPhone = deliveryPhone;
    }

    public String getDeliveryCoordinates() {
        return deliveryCoordinates;
    }

    public void setDeliveryCoordinates(String deliveryCoordinates) {
        this.deliveryCoordinates = deliveryCoordinates;
    }

    public String getTransactionUuid() {
        return transactionUuid;
    }

    public void setTransactionUuid(String transactionUuid) {
        this.transactionUuid = transactionUuid;
    }
}