package com.example.demo.service;

import com.example.demo.dto.FoodItemDto;
import com.example.demo.model.FoodItem;
import com.example.demo.repository.FoodItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodItemService {

    @Autowired
    private FoodItemRepository foodItemRepository;

    public List<FoodItem> getAvailableFoods(String name, Double minPrice, Double maxPrice) {
        return foodItemRepository.findByAvailableTrueAndFilters(name, minPrice, maxPrice);
    }

    public FoodItem saveFood(FoodItemDto foodDto, String imagePath) {
        if (foodDto.getName() == null || foodDto.getPrice() == null || foodDto.getAvailable() == null) {
            throw new IllegalArgumentException("Name, price, and availability are required.");
        }
        if (foodDto.getPrice() <= 0) {
            throw new IllegalArgumentException("Price must be positive.");
        }

        FoodItem food = new FoodItem();
        food.setName(foodDto.getName());
        food.setDescription(foodDto.getDescription());
        food.setPrice(foodDto.getPrice());
        food.setAvailable(foodDto.getAvailable());
        food.setImagePath(imagePath);

        return foodItemRepository.save(food);
    }
}