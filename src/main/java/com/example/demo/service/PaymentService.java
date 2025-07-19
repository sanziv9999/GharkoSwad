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
    public Payment createPayment(Order order, Double amount, String paymentMethod, String transactionUuid) {
        if (order == null || order.getId() == null) {
            throw new IllegalArgumentException("Order must be persisted before creating payment");
        }
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }
        if (paymentMethod == null || paymentMethod.trim().isEmpty()) {
            throw new IllegalArgumentException("Payment method is required");
        }
        Payment payment = new Payment(order, amount, paymentMethod);
        payment.setTransactionId(transactionUuid);
        
        // Set initial status based on payment method
        if ("ESEWA".equals(paymentMethod)) {
            payment.setStatus(PaymentStatus.PENDING); // Will be updated after verification
        } else if ("CASH_ON_DELIVERY".equals(paymentMethod)) {
            payment.setStatus(PaymentStatus.PENDING); // Will be updated when delivered
        }
        
        logger.debug("Creating payment: {}", payment);
        return paymentRepository.save(payment);
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

        payment.setStatus(status);
        if (transactionId != null) {
            payment.setTransactionId(transactionId);
        }
        if (status == PaymentStatus.FAILED) {
            payment.setFailureReason("Payment processing failed");
        }
        return paymentRepository.save(payment);
    }

    @Transactional(readOnly = true)
    public Payment findByOrder(Order order) {
        if (order == null) {
            throw new IllegalArgumentException("Order cannot be null");
        }
        return paymentRepository.findByOrder(order);
    }
}