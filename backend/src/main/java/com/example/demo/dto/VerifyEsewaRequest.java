package com.example.demo.dto;


public class VerifyEsewaRequest {
    private String transaction_uuid; // Changed to match eSewa response
    private Double amount;

    // Getters and Setters
    public String getTransaction_uuid() {
        return transaction_uuid;
    }

    public void setTransaction_uuid(String transaction_uuid) {
        this.transaction_uuid = transaction_uuid;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount; // Corrected from 'amouupdate on this' to 'amount'
    }
}