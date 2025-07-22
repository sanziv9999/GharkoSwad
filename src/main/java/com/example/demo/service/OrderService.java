
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
    private static final List<String> VALID_STATUSES = Arrays.asList("PLACED", "CONFIRMED", "PREPARING", "READY", "PICKED_UP", "DELIVERED", "CANCELLED");
    private static final List<String> VALID_PAYMENT_STATUSES = Arrays.asList("PENDING", "COMPLETED", "CANCELLED");
    private static final List<String> VALID_DELIVERY_STATUSES = Arrays.asList("PICKED_UP", "DELIVERED");

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

    @Transactional
    public Order updateOrderStatus(Long orderId, Long userId, String status) {
        logger.info("Updating order status for orderId={} to status={} by userId={}", orderId, status, userId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: " + userId);
        }
        if (!"CHEF".equals(user.getRole())) {
            throw new IllegalStateException("User must have CHEF role to update order status");
        }
        if (!VALID_STATUSES.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Allowed values: " + VALID_STATUSES);
        }

        String currentStatus = order.getStatus();
        if ("PLACED".equals(currentStatus) && !"CONFIRMED".equals(status.toUpperCase())) {
            throw new IllegalStateException("Order in PLACED status can only transition to CONFIRMED");
        }
        if ("CONFIRMED".equals(currentStatus) && !"PREPARING".equals(status.toUpperCase())) {
            throw new IllegalStateException("Order in CONFIRMED status can only transition to PREPARING");
        }
        if ("PREPARING".equals(currentStatus) && !"READY".equals(status.toUpperCase())) {
            throw new IllegalStateException("Order in PREPARING status can only transition to READY");
        }
        if ("READY".equals(currentStatus) || "PICKED_UP".equals(currentStatus) || "DELIVERED".equals(currentStatus) || "CANCELLED".equals(currentStatus)) {
            throw new IllegalStateException("Order in " + currentStatus + " status cannot be updated by chef");
        }

        order.setStatus(status.toUpperCase());
        return orderRepository.save(order);
    }

    @Transactional
    public Order updateDeliveryStatus(Long orderId, Long userId, String status) {
        logger.info("Updating delivery status for orderId={} to status={} by userId={}", orderId, status, userId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: " + userId);
        }
        if (!"DELIVERY".equals(user.getRole())) {
            throw new IllegalStateException("User must have DELIVERY role to update delivery status");
        }
        if (!VALID_STATUSES.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Allowed values: " + VALID_STATUSES);
        }

        String currentStatus = order.getStatus();
        if ("READY".equals(currentStatus) && !"PICKED_UP".equals(status.toUpperCase())) {
            throw new IllegalStateException("Order in READY status can only transition to PICKED_UP");
        }
        if ("PICKED_UP".equals(currentStatus) && !"DELIVERED".equals(status.toUpperCase())) {
            throw new IllegalStateException("Order in PICKED_UP status can only transition to DELIVERED");
        }
        if ("DELIVERED".equals(currentStatus) || "CANCELLED".equals(currentStatus)) {
            throw new IllegalStateException("Order in " + currentStatus + " status cannot be updated");
        }

        if ("DELIVERED".equals(status.toUpperCase()) && order.getPayment() != null && 
            "CASH_ON_DELIVERY".equals(order.getPayment().getPaymentMethod())) {
            if (order.getPayment().getStatus() != PaymentStatus.COMPLETED) {
                throw new IllegalStateException("CASH_ON_DELIVERY orders must have payment status COMPLETED to transition to DELIVERED");
            }
        }

        order.setStatus(status.toUpperCase());
        return orderRepository.save(order);
    }

    @Transactional
    public Order updatePaymentStatus(Long orderId, Long userId, String paymentStatus) {
        logger.info("Updating payment status for orderId={} to paymentStatus={} by userId={}", orderId, paymentStatus, userId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: " + userId);
        }
        if (!"DELIVERY".equals(user.getRole())) {
            throw new IllegalStateException("User must have DELIVERY role to update payment status");
        }
        if (!VALID_PAYMENT_STATUSES.contains(paymentStatus.toUpperCase())) {
            throw new IllegalArgumentException("Invalid payment status: " + paymentStatus + ". Allowed values: " + VALID_PAYMENT_STATUSES);
        }
        if (!"COMPLETED".equals(paymentStatus.toUpperCase())) {
            throw new IllegalArgumentException("Payment status can only be updated to COMPLETED");
        }

        Payment payment = order.getPayment();
        if (payment == null) {
            throw new IllegalStateException("No payment associated with the order");
        }
        if (!"CASH_ON_DELIVERY".equals(payment.getPaymentMethod())) {
            throw new IllegalStateException("Payment status can only be updated for CASH_ON_DELIVERY orders");
        }
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Payment status can only be updated from PENDING to COMPLETED");
        }

        payment.setStatus(PaymentStatus.COMPLETED);
        paymentRepository.save(payment);
        return orderRepository.save(order);
    }

    public List<Order> findOrdersByChefId(Long chefId) {
        return findOrdersByChefId(chefId, null);
    }

    public List<Order> findOrdersByChefId(Long chefId, String status) {
        logger.info("Fetching orders for chefId={} with status={}", chefId, status);
        if (chefId == null) {
            throw new IllegalArgumentException("chefId is required");
        }
        User chef = userService.findById(chefId);
        if (chef == null) {
            throw new IllegalArgumentException("Chef not found: " + chefId);
        }
        if (!"CHEF".equals(chef.getRole())) {
            throw new IllegalStateException("User must have CHEF role to fetch orders");
        }
        if (status != null && !VALID_STATUSES.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Allowed values: " + VALID_STATUSES);
        }
        if (status == null) {
            return orderRepository.findOrdersByFoodItemUserId(chefId);
        }
        return orderRepository.findOrdersByFoodItemUserIdAndStatus(chefId, status.toUpperCase());
    }

    public List<Order> findReadyOrdersForDelivery(Long userId) {
        logger.info("Fetching READY orders for delivery userId={}", userId);
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: " + userId);
        }
        if (!"DELIVERY".equals(user.getRole())) {
            throw new IllegalStateException("User must have DELIVERY role to fetch READY orders");
        }
        return orderRepository.findByStatus("READY");
    }

    public List<Order> findDeliveryOrdersByStatus(Long userId, String status) {
        logger.info("Fetching orders with status={} for delivery userId={}", status, userId);
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: " + userId);
        }
        if (!"DELIVERY".equals(user.getRole())) {
            throw new IllegalStateException("User must have DELIVERY role to fetch orders");
        }
        if (status == null || !VALID_DELIVERY_STATUSES.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Allowed values: " + VALID_DELIVERY_STATUSES);
        }
        return orderRepository.findByStatus(status.toUpperCase());
    }
}
