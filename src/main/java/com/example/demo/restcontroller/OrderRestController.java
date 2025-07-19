
package com.example.demo.restcontroller;

import com.example.demo.dto.CancelOrderRequest;
import com.example.demo.dto.OrderResponse;
import com.example.demo.dto.PlaceOrderRequest;
import com.example.demo.dto.VerifyEsewaRequest;
import com.example.demo.model.Order;
import com.example.demo.model.Payment;
import com.example.demo.model.PaymentStatus;
import com.example.demo.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderRestController {
    private static final Logger logger = LoggerFactory.getLogger(OrderRestController.class);
    private static final List<String> VALID_PAYMENT_METHODS = Arrays.asList("CASH_ON_DELIVERY", "ESEWA");

    @Autowired
    private OrderService orderService;

    @PostMapping("/place")
    public ResponseEntity<Map<String, Object>> placeOrder(@RequestBody PlaceOrderRequest request) {
        logger.info("Received place order request: userId={}, foodItemIds={}, quantities={}, amount={}, paymentMethod={}",
                request.getUserId(), request.getFoodItemIds(), request.getQuantities(), request.getAmount(), request.getPaymentMethod());
        try {
            if (request.getUserId() == null || request.getFoodItemIds() == null || request.getQuantities() == null ||
                request.getPaymentMethod() == null || request.getDeliveryLocation() == null || request.getDeliveryPhone() == null) {
                throw new IllegalArgumentException("Required fields are missing");
            }
            if (request.getAmount() == null || request.getAmount() <= 0) {
                throw new IllegalArgumentException("Valid payment amount is required");
            }
            if (!VALID_PAYMENT_METHODS.contains(request.getPaymentMethod())) {
                throw new IllegalArgumentException("Invalid payment method. Allowed values: " + VALID_PAYMENT_METHODS);
            }

            Order order = orderService.placeOrder(
                    request.getUserId(),
                    request.getFoodItemIds(),
                    request.getQuantities(),
                    request.getAmount(),
                    request.getPaymentMethod(),
                    request.getDeliveryLocation(),
                    request.getDeliveryPhone(),
                    request.getDeliveryCoordinates(),
                    request.getTransactionUuid()
            );
            OrderResponse response = new OrderResponse(order);
            logger.debug("Order placed successfully: {}", response);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("data", response);
            responseBody.put("message", "Order placed successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Error placing order: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error placing order: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to place order: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(@RequestBody CancelOrderRequest request) {
        logger.info("Received cancel order request: foodOrderId={}, userId={}",
                request.getFoodOrderId(), request.getUserId());
        try {
            if (request.getFoodOrderId() == null || request.getUserId() == null) {
                throw new IllegalArgumentException("foodOrderId and userId are required");
            }
            Order order = orderService.cancelOrder(request.getFoodOrderId(), request.getUserId());
            OrderResponse response = new OrderResponse(order);
            logger.debug("Order cancelled successfully: {}", response);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("data", response);
            responseBody.put("message", "Order cancelled successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Error cancelling order: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error cancelling order: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to cancel order: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserOrders(@PathVariable Long userId) {
        logger.info("Received request to fetch orders for userId={}", userId);
        try {
            List<Order> orders = orderService.getUserOrders(userId);
            List<OrderResponse> response = orders.stream()
                    .map(OrderResponse::new)
                    .collect(Collectors.toList());
            logger.debug("Fetched orders for userId {}: {}", userId, response);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("data", response);
            responseBody.put("message", "Orders retrieved successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException e) {
            logger.warn("Error fetching orders: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error fetching orders: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to fetch orders: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/verify-esewa")
    public ResponseEntity<Map<String, Object>> verifyEsewaPayment(@RequestBody VerifyEsewaRequest request) {
        logger.info("Received eSewa verification request: transactionUuid={}, amount={}",
                request.getTransaction_uuid(), request.getAmount());
        try {
            if (request.getTransaction_uuid() == null || request.getAmount() == null) {
                throw new IllegalArgumentException("transactionUuid and amount are required");
            }

            // Find order by transaction UUID
            Order order = orderService.findOrderByTransactionUuid(request.getTransaction_uuid());
            logger.debug("Found order: {}", order);
            if (order == null) {
                throw new IllegalStateException("Order not found for transaction UUID: " + request.getTransaction_uuid());
            }

            Payment payment = order.getPayment();
            logger.debug("Found payment: {}", payment);
            if (payment == null) {
                logger.warn("No payment found for order ID: {}", order.getId());
                throw new IllegalStateException("No payment associated with the order");
            }

            logger.debug("Stored amount: {}, Received amount: {}", payment.getAmount(), request.getAmount());
            if (Double.compare(payment.getAmount(), request.getAmount()) == 0) {
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setEsewaRefId(request.getTransaction_uuid()); // Store eSewa reference
                order.setStatus("CONFIRMED");

                // Save both payment and order
                order = orderService.saveOrder(order);
                logger.info("Payment verified and status updated to COMPLETED for order ID: {}", order.getId());

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("data", new OrderResponse(order));
                responseBody.put("message", "eSewa payment verified successfully");
                responseBody.put("status", "success");
                return ResponseEntity.ok(responseBody);
            } else {
                logger.warn("Amount mismatch: Stored amount: {}, Received amount: {}", 
                           payment.getAmount(), request.getAmount());
                throw new IllegalStateException("Invalid transaction or amount mismatch");
            }
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Error verifying eSewa payment: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error verifying eSewa payment: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to verify eSewa payment: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
