package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Otp;

public interface OtpRepository extends JpaRepository<Otp, Long>{
	Optional<Otp> findByEmail(String email);
    Optional<Otp> findByEmailAndOtpCode(String email, String otpCode);
    void deleteByEmail(String email);
	

}
