package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "food_order")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "food_item_id", nullable = false)
    private FoodItem foodItem;

    private LocalDateTime orderDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private Integer quantity;

    @OneToOne(mappedBy = "order")
    private Payment payment; // Bidirectional relationship with Payment

    // Constructors
    public Order() {}

    public Order(User user, FoodItem foodItem, Integer quantity) {
        this.user = user;
        this.foodItem = foodItem;
        this.orderDate = LocalDateTime.now();
        this.status = OrderStatus.PLACED;
        this.quantity = quantity;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public FoodItem getFoodItem() { return foodItem; }
    public void setFoodItem(FoodItem foodItem) { this.foodItem = foodItem; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Payment getPayment() { return payment; }
    public void setPayment(Payment payment) { this.payment = payment; }

    @Override
    public String toString() {
        return "Order{id=" + id + ", user=" + user.getId() + ", foodItem=" + foodItem.getId() +
                ", status=" + status + ", quantity=" + quantity + ", payment=" + (payment != null ? payment.getId() : null) + "}";
    }
}