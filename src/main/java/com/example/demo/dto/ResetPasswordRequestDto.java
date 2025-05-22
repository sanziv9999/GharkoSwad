package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ResetPasswordRequestDto {
	@NotNull
    private String email;

    @NotNull
    @Size(min = 6, max = 6, message = "OTP must be 6 digits")
    private String otpCode;

    @NotNull
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String newPassword;

    // Getters and setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOtpCode() { return otpCode; }
    public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }

}
