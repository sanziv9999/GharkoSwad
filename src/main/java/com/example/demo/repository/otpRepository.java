package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Otp;

public interface otpRepository extends JpaRepository<Otp, Long>{
	Optional<Otp> findByEmail(String email);
	

}
