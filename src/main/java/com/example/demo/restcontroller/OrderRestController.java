package com.example.demo.restcontroller;

import com.example.demo.dto.CancelOrderRequest;
import com.example.demo.dto.PlaceOrderRequest;
import com.example.demo.model.Order;
import com.example.demo.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderRestController {

    private static final Logger logger = LoggerFactory.getLogger(OrderRestController.class);

    @Autowired
    private OrderService orderService;

    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(@RequestBody PlaceOrderRequest request) {
        logger.info("Received place order request: userId={}, foodItemId={}, quantity={}", 
                request.getUserId(), request.getFoodItemId(), request.getQuantity());
        try {
            if (request.getUserId() == null || request.getFoodItemId() == null) {
                throw new IllegalArgumentException("userId and foodItemId are required");
            }
            // Quantity defaults to 1 if not provided, thanks to the DTO
            Order order = orderService.placeOrder(request.getUserId(), request.getFoodItemId(), request.getQuantity());
            logger.debug("Order placed successfully: {}", order);
            return ResponseEntity.ok(order);
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
            logger.debug("Order cancelled successfully: {}", order);
            return ResponseEntity.ok(order);
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
            if (orders.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(orders);
            }
            logger.debug("Fetched orders for userId {}: {}", userId, orders);
            return ResponseEntity.ok(orders);
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