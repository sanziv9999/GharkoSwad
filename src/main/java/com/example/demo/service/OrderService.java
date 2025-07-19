package com.example.demo.service;

import com.example.demo.dto.OrderResponse;
import com.example.demo.model.FoodItem;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.Payment;
import com.example.demo.model.PaymentStatus;
import com.example.demo.model.User;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderService {
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    private static final List<String> VALID_STATUSES = Arrays.asList("PLACED", "CONFIRMED", "CANCELLED");

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private FoodItemService foodItemService;

    @Autowired
    private UserService userService;

    @Autowired
    private PaymentService paymentService;

    @Transactional
    public Order placeOrder(Long userId, List<Long> foodItemIds, List<Integer> quantities, Double amount, String paymentMethod,
                           String deliveryLocation, String deliveryPhone, String deliveryCoordinates, String transactionUuid) {
        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        if (foodItemIds == null || quantities == null || foodItemIds.size() != quantities.size()) {
            throw new IllegalArgumentException("Food item IDs and quantities must match and not be null");
        }

        List<OrderItem> orderItems = new ArrayList<>();
        for (int i = 0; i < foodItemIds.size(); i++) {
            Long foodItemId = foodItemIds.get(i);
            Integer quantity = quantities.get(i);
            FoodItem foodItem = foodItemService.findById(foodItemId);
            if (foodItem == null) {
                throw new IllegalArgumentException("Food item not found: " + foodItemId);
            }
            if (!foodItem.getAvailable()) {
                throw new IllegalStateException("Food item is not available: " + foodItemId);
            }
            if (quantity <= 0) {
                throw new IllegalArgumentException("Quantity must be positive for food item: " + foodItemId);
            }
            orderItems.add(new OrderItem(null, foodItem, quantity));
        }

        Order order = new Order(user, orderItems, deliveryLocation, deliveryPhone, deliveryCoordinates);
        for (OrderItem orderItem : orderItems) {
            orderItem.setOrder(order);
        }
        order = orderRepository.save(order);

        Payment payment = paymentService.createPayment(order, amount, paymentMethod, transactionUuid);
        order.setPayment(payment);

        return orderRepository.save(order);
    }

    @Transactional
    public Order cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to cancel this order");
        }
        if (!order.getStatus().equals("PLACED")) {
            throw new IllegalStateException("Only placed orders can be cancelled");
        }
        order.setStatus("CANCELLED");
        if (order.getPayment() != null) {
            order.getPayment().setStatus(PaymentStatus.CANCELLED);
        }
        return orderRepository.save(order);
    }

    public List<Order> getUserOrders(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        return orderRepository.findByUserId(userId);
    }

    public Order findOrderByTransactionUuid(String transactionUuid) {
        if (transactionUuid == null) {
            throw new IllegalArgumentException("transactionUuid is required");
        }
        return orderRepository.findByPayment_TransactionId(transactionUuid);
    }

    public List<Order> findOrdersByUserIdAndStatus(Long userId, String status) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        if (status != null && !VALID_STATUSES.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Allowed values: " + VALID_STATUSES);
        }
        if (status == null) {
            logger.info("Fetching all orders for userId={}", userId);
            return orderRepository.findByUserId(userId);
        }
        logger.info("Fetching orders for userId={} with status={}", userId, status);
        return orderRepository.findByUserIdAndStatus(userId, status.toUpperCase());
    }

    @Transactional
    public List<Long> cancelOrderItems(Long userId, List<Long> orderItemIds) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        if (orderItemIds == null || orderItemIds.isEmpty()) {
            throw new IllegalArgumentException("orderItemIds cannot be null or empty");
        }

        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        List<Long> cancelledOrderItemIds = new ArrayList<>();
        Map<Long, Order> ordersToUpdate = new HashMap<>();

        for (Long orderItemId : orderItemIds) {
            OrderItem orderItem = orderRepository.findOrderItemById(orderItemId)
                    .orElseThrow(() -> new IllegalArgumentException("Order item not found: " + orderItemId));

            Order order = orderItem.getOrder();
            if (!order.getUser().getId().equals(userId)) {
                throw new IllegalStateException("Unauthorized to cancel order item: " + orderItemId);
            }
            if (!order.getStatus().equals("PLACED")) {
                throw new IllegalStateException("Only items in PLACED orders can be cancelled: " + orderItemId);
            }

            order.getOrderItems().remove(orderItem);
            cancelledOrderItemIds.add(orderItemId);
            ordersToUpdate.put(order.getId(), order);
        }

        for (Order order : ordersToUpdate.values()) {
            if (order.getOrderItems().isEmpty()) {
                order.setStatus("CANCELLED");
                if (order.getPayment() != null) {
                    order.getPayment().setStatus(PaymentStatus.CANCELLED);
                }
            } else {
                double newAmount = order.getOrderItems().stream()
                        .mapToDouble(oi -> oi.getFoodItem().getPrice() * oi.getQuantity())
                        .sum();
                if (order.getPayment() != null) {
                    order.getPayment().setAmount(newAmount);
                }
            }
            orderRepository.save(order);
        }

        return cancelledOrderItemIds;
    }

    @Transactional
    public Map<String, Object> verifyEsewaPayment(String transactionUuid, Double amount) {
        logger.info("Verifying eSewa payment with transaction_uuid: {}, amount: {}", transactionUuid, amount);
        Map<String, Object> response = new HashMap<>();

        try {
            Order order = orderRepository.findByPayment_TransactionId(transactionUuid);
            if (order == null) {
                logger.warn("Order not found for transaction_uuid: {}", transactionUuid);
                throw new IllegalArgumentException("Order not found for transaction_uuid: " + transactionUuid);
            }

            Payment payment = order.getPayment();
            if (payment == null) {
                logger.warn("No payment associated with order ID: {}", order.getId());
                throw new IllegalStateException("No payment associated with the order");
            }

            logger.info("Payment verification - Stored amount: {}, Received amount: {}, Transaction UUID: {}", 
                       payment.getAmount(), amount, transactionUuid);

            if (Double.compare(payment.getAmount(), amount) == 0) {
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setEsewaRefId(transactionUuid);
                paymentRepository.save(payment);

                order.setStatus("CONFIRMED");
                orderRepository.save(order);

                logger.info("Payment verified successfully for order ID: {}", order.getId());

                response.put("status", "success");
                response.put("message", "eSewa payment verified successfully");
                response.put("data", new OrderResponse(order));
                return response;
            } else {
                logger.warn("Amount mismatch for transaction_uuid: {}. Stored: {}, Received: {}", 
                           transactionUuid, payment.getAmount(), amount);
                throw new IllegalStateException("Invalid transaction or amount mismatch");
            }
        } catch (Exception e) {
            logger.error("Error verifying eSewa payment: {}", e.getMessage(), e);
            response.put("status", "error");
            response.put("message", "Failed to verify payment: " + e.getMessage());
            return response;
        }
    }

    @Transactional
    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }
}