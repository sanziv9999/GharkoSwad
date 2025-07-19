package com.example.demo.dto;

import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.Payment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class OrderResponse {
    private Long id;
    private Long userId;
    private List<OrderItemDetail> orderItems;
    private Double amount;
    private String paymentMethod;
    private String paymentStatus;
    private String status;
    private LocalDateTime orderDate;
    private String deliveryLocation;
    private String deliveryPhone;
    private String deliveryCoordinates;
    private String transactionUuid;

    /**
     * Inner class to represent OrderItem details.
     */
    public static class OrderItemDetail {
        private Long foodItemId;
        private String foodItemName;
        private Integer quantity;

        public OrderItemDetail(OrderItem orderItem) {
            this.foodItemId = orderItem.getFoodItem() != null ? orderItem.getFoodItem().getId() : null;
            this.foodItemName = orderItem.getFoodItem() != null ? orderItem.getFoodItem().getName() : null;
            this.quantity = orderItem.getQuantity();
        }

        // Getters and Setters
        public Long getFoodItemId() { return foodItemId; }
        public void setFoodItemId(Long foodItemId) { this.foodItemId = foodItemId; }
        public String getFoodItemName() { return foodItemName; }
        public void setFoodItemName(String foodItemName) { this.foodItemName = foodItemName; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    /**
     * Default constructor for serialization frameworks.
     */
    public OrderResponse() {}

    /**
     * Constructs an OrderResponse from an Order entity.
     * @param order The Order entity to map from.
     */
    public OrderResponse(Order order) {
        this.id = order.getId();
        this.userId = order.getUser() != null ? order.getUser().getId() : null;
        this.orderItems = order.getOrderItems() != null ? order.getOrderItems().stream()
                .map(OrderItemDetail::new)
                .collect(Collectors.toList()) : null;
        this.orderDate = order.getOrderDate();
        this.deliveryLocation = order.getDeliveryLocation();
        this.deliveryPhone = order.getDeliveryPhone();
        this.deliveryCoordinates = order.getDeliveryCoordinates();
        this.status = order.getStatus() != null ? order.getStatus() : "PLACED";

        // Fetch payment-related fields from Payment entity
        Payment payment = order.getPayment();
        if (payment != null) {
            this.amount = payment.getAmount();
            this.paymentMethod = payment.getPaymentMethod();
            this.paymentStatus = payment.getStatus() != null ? payment.getStatus().name() : "PENDING";
            this.transactionUuid = payment.getTransactionId();
        } else {
            this.amount = 0.0;
            this.paymentMethod = null;
            this.paymentStatus = "PENDING";
            this.transactionUuid = null;
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public List<OrderItemDetail> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItemDetail> orderItems) { this.orderItems = orderItems; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    public String getDeliveryLocation() { return deliveryLocation; }
    public void setDeliveryLocation(String deliveryLocation) { this.deliveryLocation = deliveryLocation; }
    public String getDeliveryPhone() { return deliveryPhone; }
    public void setDeliveryPhone(String deliveryPhone) { this.deliveryPhone = deliveryPhone; }
    public String getDeliveryCoordinates() { return deliveryCoordinates; }
    public void setDeliveryCoordinates(String deliveryCoordinates) { this.deliveryCoordinates = deliveryCoordinates; }
    public String getTransactionUuid() { return transactionUuid; }
    public void setTransactionUuid(String transactionUuid) { this.transactionUuid = transactionUuid; }
}