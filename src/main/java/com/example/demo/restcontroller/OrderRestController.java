package com.example.demo.restcontroller;

import com.example.demo.dto.CancelOrderRequest;
import com.example.demo.dto.OrderResponse;
import com.example.demo.dto.PlaceOrderRequest;
import com.example.demo.model.Order;
import com.example.demo.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderRestController {
    private static final Logger logger = LoggerFactory.getLogger(OrderRestController.class);
    private static final List<String> VALID_PAYMENT_METHODS = Arrays.asList("CREDIT_CARD", "PAYPAL", "CASH_ON_DELIVERY");

    @Autowired
    private OrderService orderService;

    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(@RequestBody PlaceOrderRequest request) {
        logger.info("Received place order request: userId={}, foodItemId={}, quantity={}, paymentMethod={}",
                request.getUserId(), request.getFoodItemId(), request.getQuantity(), request.getPaymentMethod());
        try {
            // Validate inputs
            if (request.getUserId() == null || request.getFoodItemId() == null || request.getPaymentMethod() == null) {
                throw new IllegalArgumentException("userId, foodItemId, and paymentMethod are required");
            }
            if (request.getAmount() == null || request.getAmount() <= 0) {
                throw new IllegalArgumentException("Valid payment amount is required");
            }
            if (!VALID_PAYMENT_METHODS.contains(request.getPaymentMethod())) {
                throw new IllegalArgumentException("Invalid payment method. Allowed values: " + VALID_PAYMENT_METHODS);
            }

            Order order = orderService.placeOrder(
                    request.getUserId(),
                    request.getFoodItemId(),
                    request.getQuantity(),
                    request.getAmount(),
                    request.getPaymentMethod()
            );
            OrderResponse response = new OrderResponse(order);
            logger.debug("Order placed successfully: {}", response);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Error placing order: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error placing order: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to place order: " + e.getMessage());
        }
    }

    @PutMapping("/cancel")
    public ResponseEntity<?> cancelOrder(@RequestBody CancelOrderRequest request) {
        logger.info("Received cancel order request: foodOrderId={}, userId={}",
                request.getFoodOrderId(), request.getUserId());
        try {
            if (request.getFoodOrderId() == null || request.getUserId() == null) {
                throw new IllegalArgumentException("foodOrderId and userId are required");
            }
            Order order = orderService.cancelOrder(request.getFoodOrderId(), request.getUserId());
            OrderResponse response = new OrderResponse(order);
            logger.debug("Order cancelled successfully: {}", response);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Error cancelling order: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error cancelling order: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to cancel order: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserOrders(@PathVariable Long userId) {
        logger.info("Received request to fetch orders for userId={}", userId);
        try {
            List<Order> orders = orderService.getUserOrders(userId);
            List<OrderResponse> response = orders.stream()
                    .map(OrderResponse::new)
                    .collect(Collectors.toList());
            logger.debug("Fetched orders for userId {}: {}", userId, response);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Error fetching orders: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error fetching orders: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch orders: " + e.getMessage());
        }
    }
}