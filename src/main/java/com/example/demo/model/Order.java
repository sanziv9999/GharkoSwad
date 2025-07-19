package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<OrderItem> orderItems;

    private String status = "PLACED";
    private LocalDateTime orderDate = LocalDateTime.now();

    @Column(name = "delivery_location")
    private String deliveryLocation;

    @Column(name = "delivery_phone")
    private String deliveryPhone;

    @Column(name = "delivery_coordinates")
    private String deliveryCoordinates;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Payment payment;

    // Constructors
    public Order() {}

    public Order(User user, List<OrderItem> orderItems, String deliveryLocation, String deliveryPhone, String deliveryCoordinates) {
        this.user = user;
        this.orderItems = orderItems;
        this.deliveryLocation = deliveryLocation;
        this.deliveryPhone = deliveryPhone;
        this.deliveryCoordinates = deliveryCoordinates;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public List<OrderItem> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    public String getDeliveryLocation() { return deliveryLocation; }
    public void setDeliveryLocation(String deliveryLocation) { this.deliveryLocation = deliveryLocation; }
    public String getDeliveryPhone() { return deliveryPhone; }
    public void setDeliveryPhone(String deliveryPhone) { this.deliveryPhone = deliveryPhone; }
    public String getDeliveryCoordinates() { return deliveryCoordinates; }
    public void setDeliveryCoordinates(String deliveryCoordinates) { this.deliveryCoordinates = deliveryCoordinates; }
    public Payment getPayment() { return payment; }
    public void setPayment(Payment payment) { this.payment = payment; }
}