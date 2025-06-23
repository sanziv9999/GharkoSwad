package com.example.demo.repository;

import com.example.demo.model.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {
    List<FoodItem> findByAvailableTrue();

    @Query("SELECT f FROM FoodItem f WHERE f.available = :available " +
           "AND (:name IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT(:name, '%'))) " +
           "AND (:minPrice IS NULL OR f.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR f.price <= :maxPrice) " +
           "AND (:tags IS NULL OR EXISTS (SELECT 1 FROM f.tags t WHERE t IN :tags)) " +
           "AND (:preparationTime IS NULL OR f.preparationTime = :preparationTime)")
    List<FoodItem> findByAvailabilityAndFilters(
            @Param("available") Boolean available,
            @Param("name") String name,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("tags") Set<String> tags,
            @Param("preparationTime") String preparationTime);

    List<FoodItem> findByTagsContaining(String tag);

    @Query("SELECT f FROM FoodItem f ORDER BY f.price ASC")
    List<FoodItem> findAllByOrderByPriceAsc();

    @Query("SELECT f FROM FoodItem f WHERE f.discountPercentage IS NOT NULL ORDER BY f.discountPercentage DESC")
    List<FoodItem> findAllByOrderByDiscountPercentageDesc();

    // New method to find food items by userId
    @Query("SELECT f FROM FoodItem f WHERE f.user.id = :userId AND (:available IS NULL OR f.available = :available) " +
           "AND (:name IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT(:name, '%'))) " +
           "AND (:minPrice IS NULL OR f.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR f.price <= :maxPrice) " +
           "AND (:tags IS NULL OR EXISTS (SELECT 1 FROM f.tags t WHERE t IN :tags)) " +
           "AND (:preparationTime IS NULL OR f.preparationTime = :preparationTime)")
    List<FoodItem> findByUserIdAndFilters(
            @Param("userId") Long userId,
            @Param("available") Boolean available,
            @Param("name") String name,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("tags") Set<String> tags,
            @Param("preparationTime") String preparationTime);
}