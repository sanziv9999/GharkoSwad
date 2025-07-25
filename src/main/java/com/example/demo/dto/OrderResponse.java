package com.example.demo.dto;

import com.example.demo.model.Order;
import com.example.demo.model.User;

import java.util.List;

public class OrderResponse {
    private Long orderId;
    private Long userId;
    private UserDto user;
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

    public OrderResponse(Order order) {
        this.orderId = order.getId();
        this.userId = order.getUser() != null ? order.getUser().getId() : null;
        this.user = mapUserToDto(order.getUser()); // Add this to set user
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

    private UserDto mapUserToDto(User user) {
        if (user == null) {
            return null;
        }
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail() != null ? user.getEmail() : "");
        dto.setUsername(user.getUsername() != null ? user.getUsername() : "");
        dto.setLocation(user.getLocation() != null ? user.getLocation() : "");
        dto.setPhoneNumber(user.getPhoneNumber() != null ? user.getPhoneNumber() : "");
        dto.setRole(user.getRole() != null ? user.getRole() : "");
        return dto;
    }

    // Getters and setters (unchanged)
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }
    public List<OrderItemResponse> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItemResponse> orderItems) { this.orderItems = orderItems; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getOrderDate() { return orderDate; }
    public void setOrderDate(String orderDate) { this.orderDate = orderDate; }
    public String getDeliveryLocation() { return deliveryLocation; }
    public void setDeliveryLocation(String deliveryLocation) { this.deliveryLocation = deliveryLocation; }
    public String getDeliveryPhone() { return deliveryPhone; }
    public void setDeliveryPhone(String deliveryPhone) { this.deliveryPhone = deliveryPhone; }
    public String getDeliveryCoordinates() { return deliveryCoordinates; }
    public void setDeliveryCoordinates(String deliveryCoordinates) { this.deliveryCoordinates = deliveryCoordinates; }
    public String getTransactionUuid() { return transactionUuid; }
    public void setTransactionUuid(String transactionUuid) { this.transactionUuid = transactionUuid; }
}