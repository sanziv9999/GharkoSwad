package com.example.demo.repository;

import com.example.demo.model.AddToCart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AddToCartRepository extends JpaRepository<AddToCart, Long> {
    List<AddToCart> findByUserId(Long userId);
    Optional<AddToCart> findByUserIdAndFoodId(Long userId, Long foodId);
    void deleteByUserIdAndFoodId(Long userId, Long foodId);
}