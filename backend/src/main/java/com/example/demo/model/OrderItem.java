package com.example.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "order_item")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    @NotNull(message = "Order cannot be null")
    private Order order;

    @ManyToOne
    @JoinColumn(name = "food_item_id", nullable = false)
    @NotNull(message = "Food item cannot be null")
    private FoodItem foodItem;

    @Column(nullable = false)
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    // Constructors
    public OrderItem() {}

    public OrderItem(Order order, FoodItem foodItem, Integer quantity) {
        this.order = order;
        this.foodItem = foodItem;
        this.quantity = (quantity != null && quantity > 0) ? quantity : 1;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    public FoodItem getFoodItem() { return foodItem; }
    public void setFoodItem(FoodItem foodItem) { this.foodItem = foodItem; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = (quantity != null && quantity > 0) ? quantity : 1; }

    @Override
    public String toString() {
        return "OrderItem{id=" + id + ", orderId=" + (order != null ? order.getId() : null) +
               ", foodItemId=" + (foodItem != null ? foodItem.getId() : null) + ", quantity=" + quantity + "}";
    }
}