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
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }
        if (paymentMethod == null || paymentMethod.isEmpty()) {
            throw new IllegalArgumentException("Payment method is required");
        }

        Payment payment = new Payment(order, amount, paymentMethod);
        logger.debug("Creating payment: {}", payment);
        Payment savedPayment = paymentRepository.save(payment);
        logger.debug("Saved payment: {}", savedPayment);
        return savedPayment;
    }

    @Transactional
    public Payment updatePaymentStatus(Long paymentId, PaymentStatus status, String transactionId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        logger.debug("Updating payment status: paymentId={}, newStatus={}", paymentId, status);
        payment.setStatus(status);
        payment.setTransactionId(transactionId);
        Payment updatedPayment = paymentRepository.save(payment);
        logger.debug("Updated payment: {}", updatedPayment);
        return updatedPayment;
    }

    @Transactional(readOnly = true)
    public Payment findByOrder(Order order) {
        Payment payment = paymentRepository.findByOrder(order);
        if (payment == null) {
            throw new IllegalArgumentException("No payment found for order: " + order.getId());
        }
        return payment;
    }
}