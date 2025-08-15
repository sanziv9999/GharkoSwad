package com.example.demo.dto;

public class CancelOrderItemsRequest {
    private Long userId;
    private Long orderId;

    public CancelOrderItemsRequest() {
    }

    public CancelOrderItemsRequest(Long userId, Long orderId) {
        this.userId = userId;
        this.orderId = orderId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    @Override
    public String toString() {
        return "CancelOrderItemsRequest{" +
                "userId=" + userId +
                ", orderId=" + orderId +
                '}';
    }
}