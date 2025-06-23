package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);

    private final String uploadDir = "uploads/images/";

    public FileStorageService() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
            logger.info("Upload directory created: {}", uploadDir);
        } catch (IOException e) {
            logger.error("Could not create upload directory: {}", e.getMessage(), e);
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public String storeFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            logger.warn("Attempted to store an empty or null file");
            throw new IllegalArgumentException("File is empty or null");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            logger.warn("Invalid file type: {}", contentType);
            throw new IllegalArgumentException("Only image files are allowed");
        }

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir + fileName);

        try {
            Files.write(filePath, file.getBytes());
            logger.info("File saved successfully: {}", filePath);
            return "/images/" + fileName;
        } catch (IOException e) {
            logger.error("Failed to save file {}: {}", fileName, e.getMessage(), e);
            throw e; // Re-throw to be caught by the controller
        }
    }
}