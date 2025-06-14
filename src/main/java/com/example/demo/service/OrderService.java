package com.example.demo.service;

import com.example.demo.model.FoodItem;
import com.example.demo.model.Order;
import com.example.demo.model.OrderStatus;
import com.example.demo.model.Payment;
import com.example.demo.model.PaymentStatus;
import com.example.demo.model.User;
import com.example.demo.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderService {
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private FoodItemService foodItemService;

    @Autowired
    private UserService userService;

    @Autowired
    private PaymentService paymentService;

    @Transactional
    public Order placeOrder(Long userId, Long foodItemId, Integer quantity, Double amount, String paymentMethod) {
        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        FoodItem foodItem = foodItemService.findById(foodItemId);
        if (foodItem == null) {
            throw new IllegalArgumentException("Food item not found");
        }

        if (!foodItem.getAvailable()) {
            throw new IllegalStateException("Food item is not available");
        }

        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be a positive integer");
        }

        // Validate amount
        Double expectedAmount = foodItem.getPrice() * quantity; // Using Double for calculation
        if (amount == null || Math.abs(amount - expectedAmount) > 0.01) { // Allow small floating-point differences
            throw new IllegalArgumentException("Payment amount does not match order total");
        }

        Order order = new Order(user, foodItem, quantity);
        logger.debug("Placing order: {}", order);
        Order savedOrder = orderRepository.save(order);
        logger.debug("Saved order: {}", savedOrder);

        // Create payment
        Payment payment = paymentService.createPayment(savedOrder, amount, paymentMethod);
        savedOrder.setPayment(payment);
        logger.debug("Associated payment with order: {}", payment);

        // Reload to verify persisted state
        Order reloadedOrder = orderRepository.findById(savedOrder.getId()).orElse(null);
        logger.debug("Reloaded order from DB: {}", reloadedOrder);
        return savedOrder;
    }

    @Transactional
    public Order cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            throw new IllegalArgumentException("Order not found");
        }

        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Order does not belong to this user");
        }

        if (order.getStatus() != OrderStatus.PLACED) {
            throw new IllegalStateException("Order cannot be cancelled; current status: " + order.getStatus());
        }

        // Check payment status
        Payment payment = paymentService.findByOrder(order);
        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel order; payment already completed");
        }

        logger.debug("Cancelling order: {}", order);
        order.setStatus(OrderStatus.CANCELLED);
        payment.setStatus(PaymentStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);
        paymentService.updatePaymentStatus(payment.getId(), PaymentStatus.CANCELLED, null);
        logger.debug("Cancelled order: {}", savedOrder);

        // Reload to verify persisted state
        Order reloadedOrder = orderRepository.findById(savedOrder.getId()).orElse(null);
        logger.debug("Reloaded order from DB: {}", reloadedOrder);
        return savedOrder;
    }

    @Transactional(readOnly = true)
    public List<Order> getUserOrders(Long userId) {
        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        List<Order> orders = orderRepository.findByUser(user);
        logger.debug("Fetched orders for userId {}: {}", userId, orders);
        return orders;
    }
}