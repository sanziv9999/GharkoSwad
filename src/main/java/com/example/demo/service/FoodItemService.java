package com.example.demo.service;

import com.example.demo.dto.FoodItemDto;
import com.example.demo.model.FoodItem;
import com.example.demo.model.User;
import com.example.demo.repository.FoodItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class FoodItemService {

	@Autowired
    private FoodItemRepository foodItemRepository;

    public List<FoodItem> getAvailableFoods(String name, Double minPrice, Double maxPrice) {
        return foodItemRepository.findByAvailabilityAndFilters(true, name, minPrice, maxPrice, null, null);
    }

    public List<FoodItem> getAllFoods() {
        return foodItemRepository.findAll();
    }

    public List<FoodItem> searchFoods(Boolean available, String name, Double minPrice, Double maxPrice,
                                     Set<String> tags, String preparationTime) {
        return foodItemRepository.findByAvailabilityAndFilters(available, name, minPrice, maxPrice, tags, preparationTime);
    }

    public List<FoodItem> searchFoodsByUserId(Long userId, Boolean available, String name, Double minPrice, Double maxPrice,
                                             Set<String> tags, String preparationTime) {
        return foodItemRepository.findByUserIdAndFilters(userId, available, name, minPrice, maxPrice, tags, preparationTime);
    }

    public FoodItem saveFood(FoodItemDto foodDto, String imagePath, User user) {
        if (foodDto.getName() == null || foodDto.getPrice() == null || foodDto.getAvailable() == null) {
            throw new IllegalArgumentException("Name, price, and availability are required.");
        }
        if (foodDto.getPrice() <= 0) {
            throw new IllegalArgumentException("Price must be positive.");
        }
        if (foodDto.getOriginalPrice() != null && foodDto.getOriginalPrice() <= 0) {
            throw new IllegalArgumentException("Original price must be positive if provided.");
        }
        if (foodDto.getDiscountPercentage() != null && (foodDto.getDiscountPercentage() < 0 || foodDto.getDiscountPercentage() > 100)) {
            throw new IllegalArgumentException("Discount percentage must be between 0 and 100 if provided.");
        }

        FoodItem food = new FoodItem();
        food.setName(foodDto.getName());
        food.setDescription(foodDto.getDescription());
        food.setPrice(foodDto.getPrice());
        food.setOriginalPrice(foodDto.getOriginalPrice());
        food.setAvailable(foodDto.getAvailable());
        food.setImagePath(imagePath);
        food.setPreparationTime(foodDto.getPreparationTime());
        food.setTags(foodDto.getTags() != null ? new HashSet<>(foodDto.getTags()) : null);
        food.setDiscountPercentage(foodDto.getDiscountPercentage());
        food.setUser(user);

        return foodItemRepository.save(food);
    }

    public FoodItem saveFood(FoodItem food) {
        return foodItemRepository.save(food);
    }

    public FoodItem findById(Long id) {
        return foodItemRepository.findById(id).orElse(null);
    }

    public void deleteById(Long id) {
        foodItemRepository.deleteById(id);
    }

    public List<FoodItem> findByTag(String tag) {
        return foodItemRepository.findByTagsContaining(tag);
    }

    public List<FoodItem> getAllByPriceAsc() {
        return foodItemRepository.findAllByOrderByPriceAsc();
    }

    public List<FoodItem> getAllByDiscountPercentageDesc() {
        return foodItemRepository.findAllByOrderByDiscountPercentageDesc();
    }
}