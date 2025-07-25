
package com.example.demo.restcontroller;

import com.example.demo.dto.CancelOrderItemsRequest;
import com.example.demo.dto.FoodItemDto;
import com.example.demo.dto.OrderItemResponse;
import com.example.demo.dto.OrderResponse;
import com.example.demo.dto.PlaceOrderRequest;
import com.example.demo.dto.UserDto;
import com.example.demo.dto.VerifyEsewaRequest;
import com.example.demo.model.FoodItem;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.Payment;
import com.example.demo.model.PaymentStatus;
import com.example.demo.model.User;
import com.example.demo.service.FoodItemService;
import com.example.demo.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
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

    @Autowired
    private FoodItemService foodItemService;

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

    @PutMapping("/cancel-order")
    public ResponseEntity<Map<String, Object>> cancelOrder(@RequestBody CancelOrderItemsRequest request) {
        logger.info("Received cancel order request: userId={}, orderId={}",
                request.getUserId(), request.getOrderId());
        try {
            if (request.getUserId() == null || request.getOrderId() == null) {
                throw new IllegalArgumentException("userId and orderId are required");
            }
            Order cancelledOrder = orderService.cancelOrder(request.getOrderId(), request.getUserId());
            OrderResponse orderResponse = new OrderResponse(cancelledOrder);
            enrichOrderItems(cancelledOrder, orderResponse);
            logger.debug("Order cancelled successfully: {}", orderResponse);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("data", orderResponse);
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
            List<OrderResponse> response = orders != null ? orders.stream()
                    .map(order -> {
                        OrderResponse orderResponse = new OrderResponse(order);
                        enrichOrderItems(order, orderResponse);
                        return orderResponse;
                    })
                    .collect(Collectors.toList()) : Collections.emptyList();
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

    @GetMapping("/user/{userId}/status")
    public ResponseEntity<Map<String, Object>> getUserOrdersByStatus(
            @PathVariable Long userId,
            @RequestParam(required = false) String status) {
        logger.info("Received request to fetch orders for userId={} with status={}", userId, status);
        try {
            if (userId == null) {
                throw new IllegalArgumentException("userId is required");
            }
            List<Order> orders = orderService.findOrdersByUserIdAndStatus(userId, status);
            List<OrderResponse> response = orders != null ? orders.stream()
                    .map(order -> {
                        OrderResponse orderResponse = new OrderResponse(order);
                        enrichOrderItems(order, orderResponse);
                        return orderResponse;
                    })
                    .collect(Collectors.toList()) : Collections.emptyList();

            Map<String, Object> responseBody = new HashMap<>();
            if (response.isEmpty()) {
                responseBody.put("data", response);
                responseBody.put("message", "No orders found for userId " + userId + (status != null ? " with status " + status : ""));
                responseBody.put("status", "success");
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(responseBody);
            }

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

    @GetMapping("/delivery/{userId}/ready")
    public ResponseEntity<Map<String, Object>> getReadyOrdersForDelivery(@PathVariable Long userId) {
        logger.info("Received request to fetch READY orders for delivery userId={}", userId);
        try {
            if (userId == null) {
                throw new IllegalArgumentException("userId is required");
            }
            List<Order> orders = orderService.findReadyOrdersForDelivery(userId);
            List<OrderResponse> response = orders != null ? orders.stream()
                    .map(order -> {
                        OrderResponse orderResponse = new OrderResponse(order);
                        enrichOrderItems(order, orderResponse);
                        return orderResponse;
                    })
                    .collect(Collectors.toList()) : Collections.emptyList();

            Map<String, Object> responseBody = new HashMap<>();
            if (response.isEmpty()) {
                responseBody.put("data", response);
                responseBody.put("message", "No READY orders found for delivery userId " + userId);
                responseBody.put("status", "success");
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(responseBody);
            }

            responseBody.put("data", response);
            responseBody.put("message", "READY orders retrieved successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Error fetching READY orders: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error fetching READY orders: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to fetch READY orders: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/delivery/{userId}/status")
    public ResponseEntity<Map<String, Object>> getDeliveryOrdersByStatus(
            @PathVariable Long userId,
            @RequestParam String status) {
        logger.info("Received request to fetch orders for delivery userId={} with status={}", userId, status);
        try {
            if (userId == null) {
                throw new IllegalArgumentException("userId is required");
            }
            if (status == null || status.trim().isEmpty()) {
                throw new IllegalArgumentException("status is required");
            }
            List<Order> orders = orderService.findDeliveryOrdersByStatus(userId, status);
            List<OrderResponse> response = orders != null ? orders.stream()
                    .map(order -> {
                        OrderResponse orderResponse = new OrderResponse(order);
                        enrichOrderItems(order, orderResponse);
                        return orderResponse;
                    })
                    .collect(Collectors.toList()) : Collections.emptyList();

            Map<String, Object> responseBody = new HashMap<>();
            if (response.isEmpty()) {
                responseBody.put("data", response);
                responseBody.put("message", "No orders found for delivery userId " + userId + " with status " + status);
                responseBody.put("status", "success");
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(responseBody);
            }

            responseBody.put("data", response);
            responseBody.put("message", "Orders retrieved successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Error fetching delivery orders: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error fetching delivery orders: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to fetch delivery orders: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{orderId}/delivery-status")
    public ResponseEntity<Map<String, Object>> updateDeliveryStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> requestBody) {
        logger.info("Received request to update delivery status for orderId={}", orderId);
        try {
            Long userId = requestBody.get("userId") != null ? ((Number) requestBody.get("userId")).longValue() : null;
            String status = (String) requestBody.get("status");
            if (userId == null) {
                throw new IllegalArgumentException("userId is required in request body");
            }
            if (status == null || status.trim().isEmpty()) {
                throw new IllegalArgumentException("status is required in request body");
            }

            Order updatedOrder = orderService.updateDeliveryStatus(orderId, userId, status);
            OrderResponse orderResponse = new OrderResponse(updatedOrder);
            enrichOrderItems(updatedOrder, orderResponse);
            logger.debug("Delivery status updated to {} successfully: {}", status, orderResponse);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("data", orderResponse);
            responseBody.put("message", "Delivery status updated to " + status + " successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Error updating delivery status: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error updating delivery status: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to update delivery status: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{orderId}/payment-status")
    public ResponseEntity<Map<String, Object>> updatePaymentStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> requestBody) {
        logger.info("Received request to update payment status for orderId={}", orderId);
        try {
            Long userId = requestBody.get("userId") != null ? ((Number) requestBody.get("userId")).longValue() : null;
            String paymentStatus = (String) requestBody.get("paymentStatus");
            if (userId == null) {
                throw new IllegalArgumentException("userId is required in request body");
            }
            if (paymentStatus == null || paymentStatus.trim().isEmpty()) {
                throw new IllegalArgumentException("paymentStatus is required in request body");
            }

            Order updatedOrder = orderService.updatePaymentStatus(orderId, userId, paymentStatus);
            OrderResponse orderResponse = new OrderResponse(updatedOrder);
            enrichOrderItems(updatedOrder, orderResponse);
            logger.debug("Payment status updated to {} successfully: {}", paymentStatus, orderResponse);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("data", orderResponse);
            responseBody.put("message", "Payment status updated to " + paymentStatus + " successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Error updating payment status: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error updating payment status: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to update payment status: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PutMapping("/{orderId}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> requestBody) {
        logger.info("Received request to update order status for orderId={}", orderId);
        try {
            Long userId = requestBody.get("userId") != null ? ((Number) requestBody.get("userId")).longValue() : null;
            String status = (String) requestBody.get("status");
            if (userId == null) {
                throw new IllegalArgumentException("userId is required in request body");
            }
            if (status == null || status.trim().isEmpty()) {
                throw new IllegalArgumentException("status is required in request body");
            }

            Order updatedOrder = orderService.updateOrderStatus(orderId, userId, status);
            OrderResponse orderResponse = new OrderResponse(updatedOrder);
            enrichOrderItems(updatedOrder, orderResponse);
            logger.debug("Order status updated to {} successfully: {}", status, orderResponse);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("data", orderResponse);
            responseBody.put("message", "Order status updated to " + status + " successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Error updating order status: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error updating order status: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to update order status: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/chef/{userId}")
    public ResponseEntity<Map<String, Object>> getOrdersByChefId(
            @PathVariable Long userId,
            @RequestParam(required = false) String status) {
        logger.info("Received request to fetch orders for chefId={} with status={}", userId, status);
        try {
            if (userId == null) {
                throw new IllegalArgumentException("chefId is required");
            }
            List<Order> orders = orderService.findOrdersByChefId(userId, status);
            List<OrderResponse> response = orders != null ? orders.stream()
                    .map(order -> {
                        OrderResponse orderResponse = new OrderResponse(order);
                        enrichOrderItems(order, orderResponse);
                        return orderResponse;
                    })
                    .collect(Collectors.toList()) : Collections.emptyList();
            logger.debug("Fetched orders for chefId {}: {}", userId, response);

            Map<String, Object> responseBody = new HashMap<>();
            if (response.isEmpty()) {
                responseBody.put("data", response);
                responseBody.put("message", "No orders found for chefId " + userId + (status != null ? " with status " + status : ""));
                responseBody.put("status", "success");
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(responseBody);
            }

            responseBody.put("data", response);
            responseBody.put("message", "Orders retrieved successfully");
            responseBody.put("status", "success");
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Error fetching orders for chef: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Unexpected error fetching orders for chef: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("data", null);
            errorResponse.put("message", "Failed to fetch orders: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    private void enrichOrderItems(Order order, OrderResponse orderResponse) {
        if (order.getOrderItems() != null) {
            List<OrderItemResponse> orderItemResponses = order.getOrderItems().stream()
                    .map(item -> {
                        FoodItem foodItem = foodItemService.findById(item.getFoodItem().getId());
                        FoodItemDto foodItemDto = new FoodItemDto();
                        if (foodItem != null) {
                            mapFoodToDto(foodItem, foodItemDto);
                        } else {
                            logger.warn("Food item not found for foodItemId: {}", item.getFoodItem().getId());
                            foodItemDto.setId(item.getFoodItem().getId());
                            foodItemDto.setName("Unknown");
                        }
                        return new OrderItemResponse(item.getId(), foodItemDto, item.getQuantity());
                    })
                    .collect(Collectors.toList());
            orderResponse.setOrderItems(orderItemResponses);
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
                payment.setEsewaRefId(request.getTransaction_uuid());
                order.setStatus("CONFIRMED");

                order = orderService.saveOrder(order);
                OrderResponse orderResponse = new OrderResponse(order);
                enrichOrderItems(order, orderResponse);
                orderResponse.setUser(mapUserToDto(order.getUser()));
                logger.info("Payment verified and status updated to COMPLETED for order ID: {}", order.getId());

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("data", orderResponse);
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
    
    private UserDto mapUserToDto(User user) {
        if (user == null) {
            return null;
        }
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail() != null ? user.getEmail() : "");
        dto.setUsername(user.getUsername() != null ? user.getUsername() : "");
        dto.setLocation(user.getLocation() != null ? user.getLocation() : "");
        dto.setPhoneNumber(user.getPhoneNumber() != null ? user.getPhoneNumber() : "");
        dto.setRole(user.getRole() != null ? user.getRole() : "");
        return dto;
    }


    private void mapFoodToDto(FoodItem food, FoodItemDto dto) {
        dto.setId(food.getId());
        dto.setName(food.getName() != null ? food.getName() : "");
        dto.setDescription(food.getDescription() != null ? food.getDescription() : "");
        dto.setPrice(food.getPrice());
        dto.setOriginalPrice(food.getOriginalPrice());
        dto.setAvailable(food.getAvailable() != null ? food.getAvailable() : false);
        dto.setImagePath(food.getImagePath() != null ? food.getImagePath() : "");
        dto.setPreparationTime(food.getPreparationTime() != null ? food.getPreparationTime() : "");
        dto.setTags(food.getTags() != null ? new HashSet<>(food.getTags()) : new HashSet<>());
        dto.setDiscountPercentage(food.getDiscountPercentage() != null ? food.getDiscountPercentage() : 0.0);
        if (food.getUser() != null) {
            UserDto userDto = new UserDto();
            userDto.setEmail(food.getUser().getEmail());
            userDto.setUsername(food.getUser().getUsername());
            userDto.setLocation(food.getUser().getLocation());
            userDto.setPhoneNumber(food.getUser().getPhoneNumber());
            dto.setUser(userDto);
        }
    }
}
