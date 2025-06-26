package com.example.demo.service;

import com.example.demo.model.Order;
import com.example.demo.model.Payment;
import com.example.demo.model.PaymentStatus;
import com.example.demo.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    @Autowired
    private PaymentRepository paymentRepository;

    @Transactional
    public Payment createPayment(Order order, Double amount, String paymentMethod) {
        if (order == null) {
            throw new IllegalArgumentException("Order cannot be null");
        }
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }
        if (paymentMethod == null || paymentMethod.trim().isEmpty()) {
            throw new IllegalArgumentException("Payment method is required");
        }

        Payment payment = new Payment(order, amount, paymentMethod);
        payment.setStatus(paymentMethod.equalsIgnoreCase("CASH_ON_DELIVERY") ? PaymentStatus.PLACED : PaymentStatus.PENDING);

        logger.debug("Creating payment: {}", payment);
        Payment savedPayment = paymentRepository.save(payment);
        logger.debug("Saved payment: {}", savedPayment);
        return savedPayment;
    }

    @Transactional
    public Payment updatePaymentStatus(Long paymentId, PaymentStatus status, String transactionId) {
        if (paymentId == null) {
            throw new IllegalArgumentException("Payment ID cannot be null");
        }
        if (status == null) {
            throw new IllegalArgumentException("Payment status cannot be null");
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found with ID: " + paymentId));

        logger.debug("Updating payment status: paymentId={}, newStatus={}", paymentId, status);
        payment.setStatus(status);
        if (transactionId != null) {
            payment.setTransactionId(transactionId);
        }
        if (status == PaymentStatus.FAILED) {
            payment.setFailureReason("Payment processing failed");
        }
        Payment updatedPayment = paymentRepository.save(payment);
        logger.debug("Updated payment: {}", updatedPayment);
        return updatedPayment;
    }

    @Transactional(readOnly = true)
    public Payment findByOrder(Order order) {
        if (order == null) {
            throw new IllegalArgumentException("Order cannot be null");
        }
        Payment payment = paymentRepository.findByOrder(order);
        if (payment == null) {
            throw new IllegalArgumentException("No payment found for order ID: " + order.getId());
        }
        return payment;
    }

    @Transactional(readOnly = true)
    public Payment findByOrderId(Long orderId) {
        if (orderId == null) {
            throw new IllegalArgumentException("Order ID cannot be null");
        }
        return paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("No payment found for order ID: " + orderId));
    }
}