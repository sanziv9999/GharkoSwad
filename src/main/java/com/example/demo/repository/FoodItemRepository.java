package com.example.demo.repository;

import com.example.demo.model.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {
    List<FoodItem> findByAvailableTrue();
 
    @Query("SELECT f FROM FoodItem f WHERE f.available = :available " +
           "AND (:name IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT(:name, '%'))) " +
           "AND (:minPrice IS NULL OR f.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR f.price <= :maxPrice)")
    List<FoodItem> findByAvailabilityAndFilters(
            @Param("available") Boolean available,
            @Param("name") String name,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice);
}