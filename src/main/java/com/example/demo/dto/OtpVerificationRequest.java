package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

public class OtpVerificationRequest {
    @NotNull
    @Email
    private String email;

    @NotNull
    private String otpCode;

    @NotNull
    private UserDto user;

    // Getters and setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOtpCode() { return otpCode; }
    public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }
}