package com.example.demo.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import com.example.demo.model.Order;
import com.example.demo.model.User;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // Send OTP email (retained from original)
    public void sendOtpEmail(String to, String otpCode) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

        helper.setTo(to);
        helper.setSubject("Your OTP Code");
        helper.setText("Your OTP code is: <b>" + otpCode + "</b>. It is valid for 5 minutes.", true);

        mailSender.send(mimeMessage);
    }

    // Send order confirmation email
    public void sendOrderConfirmationEmail(User user, Order order) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

        helper.setTo(user.getEmail());
        helper.setSubject("Order Confirmation - Order #" + order.getId());
        StringBuilder emailContent = new StringBuilder();
        emailContent.append("<h2>Order Confirmation</h2>")
                    .append("<p>Dear ").append(user.getUsername()).append(",</p>")
                    .append("<p>Thank you for your order! Your order has been successfully placed.</p>")
                    .append("<h3>Order Details:</h3>")
                    .append("<p>Order ID: ").append(order.getId()).append("</p>")
                    .append("<p>Total Amount: Rs.").append(order.getPayment().getAmount()).append("</p>")
                    .append("<p>Payment Method: ").append(order.getPayment().getPaymentMethod() != null ? order.getPayment().getPaymentMethod() : "Unknown").append("</p>")
                    .append("<p>Delivery Location: ").append(order.getDeliveryLocation()).append("</p>")
                    .append("<p>Status: ").append(order.getStatus()).append("</p>")
                    .append("<h4>Items Ordered:</h4>")
                    .append("<ul>");
        order.getOrderItems().forEach(item -> {
            emailContent.append("<li>")
                        .append(item.getFoodItem().getName())
                        .append(" (Quantity: ").append(item.getQuantity()).append(")")
                        .append("</li>");
        });
        emailContent.append("</ul>")
                    .append("<p>We will notify you once your order status changes.</p>")
                    .append("<p>Thank you for choosing us!</p>");

        helper.setText(emailContent.toString(), true);
        mailSender.send(mimeMessage);
    }

    // Send order cancellation email
    public void sendOrderCancellationEmail(User user, Order order) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

        helper.setTo(user.getEmail());
        helper.setSubject("Order Cancellation - Order #" + order.getId());
        String emailContent = "<h2>Order Cancelled</h2>" +
                             "<p>Dear " + user.getUsername() + ",</p>" +
                             "<p>Your order with ID #" + order.getId() + " has been cancelled.</p>" +
                             "<p>If you have any questions, please contact our support team.</p>" +
                             "<p>Thank you for choosing us!</p>";

        helper.setText(emailContent, true);
        mailSender.send(mimeMessage);
    }

    // Send order status update email
    public void sendOrderStatusUpdateEmail(User user, Order order, String newStatus) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

        helper.setTo(user.getEmail());
        helper.setSubject("Order Status Update - Order #" + order.getId());
        String emailContent = "<h2>Order Status Updated</h2>" +
                             "<p>Dear " + user.getUsername() + ",</p>" +
                             "<p>Your order with ID #" + order.getId() + " has been updated to status: <b>" + newStatus + "</b>.</p>" +
                             "<p>Thank you for choosing us!</p>";

        helper.setText(emailContent, true);
        mailSender.send(mimeMessage);
    }

    // Send payment status update email
    public void sendPaymentStatusUpdateEmail(User user, Order order, String paymentStatus) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

        helper.setTo(user.getEmail());
        helper.setSubject("Payment Status Update - Order #" + order.getId());
        String emailContent = "<h2>Payment Status Updated</h2>" +
                             "<p>Dear " + user.getUsername() + ",</p>" +
                             "<p>The payment for your order with ID #" + order.getId() + " has been updated to status: <b>" + paymentStatus + "</b>.</p>" +
                             "<p>Amount: Rs." + order.getPayment().getAmount() + "</p>" +
                             "<p>Thank you for choosing us!</p>";

        helper.setText(emailContent, true);
        mailSender.send(mimeMessage);
    }
}