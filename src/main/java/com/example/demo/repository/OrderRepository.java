package com.example.demo.repository;

import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);
    List<Order> findByUserIdAndStatus(Long userId, String status);
    Order findByPayment_TransactionId(String transactionId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.id = :orderItemId")
    Optional<OrderItem> findOrderItemById(@Param("orderItemId") Long orderItemId);
}