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
    Optional<Order> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.id = :orderItemId")
    Optional<OrderItem> findOrderItemById(@Param("orderItemId") Long orderItemId);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.orderItems oi WHERE oi.foodItem.user.id = :chefId")
    List<Order> findOrdersByFoodItemUserId(@Param("chefId") Long chefId);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.orderItems oi WHERE oi.foodItem.user.id = :chefId AND o.status = :status")
    List<Order> findOrdersByFoodItemUserIdAndStatus(@Param("chefId") Long chefId, @Param("status") String status);
}