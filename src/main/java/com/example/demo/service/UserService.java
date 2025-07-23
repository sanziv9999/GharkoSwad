package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {
	private static final Logger logger = LoggerFactory.getLogger(UserService.class);
	
    @Autowired
    private UserRepository userRepository;
    
    

    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User saveUser(User user) {
        if (user.getRole() == null || user.getRole().isEmpty() || (!user.getRole().equals("CHEF") && !user.getRole().equals("USER"))) {
            user.setRole("USER");
        }
        return userRepository.save(user);
    }
    
    public List<User> findUsersByRole(String role) {
        logger.info("Fetching users with role={}", role);
        if (role == null || role.trim().isEmpty()) {
            throw new IllegalArgumentException("Role is required");
        }
        return userRepository.findByRole(role.toUpperCase());
    }
}