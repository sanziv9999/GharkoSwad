package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.User;

public interface userRepository extends JpaRepository<User, Long> {
	Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
	

}
