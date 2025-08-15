package com.example.demo.restcontroller;

import com.example.demo.dto.CartItemDto;
import com.example.demo.model.AddToCart;
import com.example.demo.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> addToCart(
            @RequestParam Long userId,
            @RequestParam Long foodId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        Map<String, Object> response = new HashMap<>();
        try {
            AddToCart cartItem = cartService.addToCart(userId, foodId, quantity);
            CartItemDto cartItemDto = cartService.convertToDto(cartItem);
            response.put("status", "success");
            response.put("message", "Item added to cart successfully");
            response.put("data", cartItemDto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Failed to add item to cart: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCartItems(@RequestParam Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<CartItemDto> cartItems = cartService.getCartItemsByUser(userId);
            if (cartItems.isEmpty()) {
                response.put("status", "success");
                response.put("message", "No items found in cart");
                response.put("data", cartItems);
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
            }
            response.put("status", "success");
            response.put("message", "Cart items retrieved successfully");
            response.put("data", cartItems);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Failed to retrieve cart items: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/increase/{foodId}")
    public ResponseEntity<Map<String, Object>> increaseQuantity(
            @RequestParam Long userId,
            @PathVariable Long foodId) {
        Map<String, Object> response = new HashMap<>();
        try {
            CartItemDto updatedItem = cartService.increaseQuantity(userId, foodId);
            response.put("status", "success");
            response.put("message", "Quantity increased successfully");
            response.put("data", updatedItem);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Failed to increase quantity: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/decrease/{foodId}")
    public ResponseEntity<Map<String, Object>> decreaseQuantity(
            @RequestParam Long userId,
            @PathVariable Long foodId) {
        Map<String, Object> response = new HashMap<>();
        try {
            CartItemDto updatedItem = cartService.decreaseQuantity(userId, foodId);
            response.put("status", "success");
            response.put("message", "Quantity decreased successfully");
            response.put("data", updatedItem);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Failed to decrease quantity: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/{foodId}")
    public ResponseEntity<Map<String, Object>> deleteCartItem(
            @RequestParam Long userId,
            @PathVariable Long foodId) {
        Map<String, Object> response = new HashMap<>();
        try {
            cartService.deleteCartItem(userId, foodId);
            response.put("status", "success");
            response.put("message", "Item deleted from cart successfully");
            response.put("data", null); // No data needed for delete
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Failed to delete item from cart: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> clearCart(@RequestParam Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            cartService.clearCart(userId);
            response.put("status", "success");
            response.put("message", "Cart cleared successfully");
            response.put("data", null); // No data needed for clear
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Failed to clear cart: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}