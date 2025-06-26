package com.example.demo.repository;

import com.example.demo.model.Order;
import com.example.demo.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Payment findByOrder(Order order);
    Optional<Payment> findByOrderId(Long orderId);
}