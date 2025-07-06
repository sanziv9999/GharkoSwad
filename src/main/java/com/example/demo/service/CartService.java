package com.example.demo.service;

import com.example.demo.dto.CartItemDto;
import com.example.demo.model.AddToCart;
import com.example.demo.model.FoodItem;
import com.example.demo.repository.AddToCartRepository;
import com.example.demo.repository.FoodItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartService {

    @Autowired
    private AddToCartRepository addToCartRepository;

    @Autowired
    private FoodItemRepository foodItemRepository;

    @Transactional
    public AddToCart addToCart(Long userId, Long foodId, Integer quantity) {
        FoodItem foodItem = foodItemRepository.findById(foodId)
            .orElseThrow(() -> new RuntimeException("Food item not found: " + foodId));

        if (!foodItem.getAvailable()) {
            throw new RuntimeException("Food item is not available: " + foodId);
        }

        Optional<AddToCart> existingCartItem = addToCartRepository.findByUserIdAndFoodId(userId, foodId);
        if (existingCartItem.isPresent()) {
            AddToCart cartItem = existingCartItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
            return addToCartRepository.save(cartItem);
        }

        AddToCart newCartItem = new AddToCart(foodId, userId, quantity);
        return addToCartRepository.save(newCartItem);
    }

    public List<CartItemDto> getCartItemsByUser(Long userId) {
        List<AddToCart> cartItems = addToCartRepository.findByUserId(userId);
        return cartItems.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional
    public CartItemDto increaseQuantity(Long userId, Long foodId) {
        AddToCart cartItem = addToCartRepository.findByUserIdAndFoodId(userId, foodId)
            .orElseThrow(() -> new RuntimeException("Cart item not found"));
        cartItem.setQuantity(cartItem.getQuantity() + 1);
        addToCartRepository.save(cartItem);
        return convertToDto(cartItem);
    }

    @Transactional
    public CartItemDto decreaseQuantity(Long userId, Long foodId) {
        AddToCart cartItem = addToCartRepository.findByUserIdAndFoodId(userId, foodId)
            .orElseThrow(() -> new RuntimeException("Cart item not found"));
        if (cartItem.getQuantity() <= 1) {
            throw new RuntimeException("Quantity cannot be less than 1");
        }
        cartItem.setQuantity(cartItem.getQuantity() - 1);
        addToCartRepository.save(cartItem);
        return convertToDto(cartItem);
    }

    @Transactional
    public void deleteCartItem(Long userId, Long foodId) {
        addToCartRepository.deleteByUserIdAndFoodId(userId, foodId);
    }

    @Transactional
    public void clearCart(Long userId) {
        List<AddToCart> cartItems = addToCartRepository.findByUserId(userId);
        addToCartRepository.deleteAll(cartItems);
    }

    public CartItemDto convertToDto(AddToCart cartItem) {
        FoodItem foodItem = foodItemRepository.findById(cartItem.getFoodId())
            .orElseThrow(() -> new RuntimeException("Food item not found: " + cartItem.getFoodId()));

        CartItemDto dto = new CartItemDto();
        dto.setId(cartItem.getId());
        dto.setFoodId(cartItem.getFoodId());
        dto.setUserId(cartItem.getUserId());
        dto.setQuantity(cartItem.getQuantity());
        dto.setName(foodItem.getName());
        dto.setPrice(foodItem.getPrice() != null ? foodItem.getPrice() :
                     foodItem.getOriginalPrice() * (1 - (foodItem.getDiscountPercentage() != null ? foodItem.getDiscountPercentage() / 100 : 0)));
        dto.setImageUrl(foodItem.getImagePath() != null ? "/images" + foodItem.getImagePath().replace("/images", "") : "");
        dto.setDescription(foodItem.getDescription());
        dto.setPreparationTime(foodItem.getPreparationTime());
        dto.setTags(foodItem.getTags());
        dto.setDiscountPercentage(foodItem.getDiscountPercentage());
        return dto;
    }
}