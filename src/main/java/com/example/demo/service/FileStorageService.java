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
    private static final String UPLOAD_DIR = "uploads/images/";
    private static final String BASE_URL = "/images/"; // Relative path for client use

    public String storeFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            logger.warn("No file provided for upload");
            return null;
        }

        // Validate file type (only images)
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            logger.warn("Invalid file type: {}. Only image files are allowed", contentType);
            throw new IOException("Only image files are allowed");
        }

        // Ensure upload directory exists
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            logger.info("Created upload directory: {}", uploadPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
        Path filePath = uploadPath.resolve(uniqueFilename);

        // Save the file
        try {
            Files.copy(file.getInputStream(), filePath);
            logger.info("File saved successfully: {}", filePath);
            return BASE_URL + uniqueFilename;
        } catch (IOException e) {
            logger.error("Failed to save file {}: {}", filePath, e.getMessage());
            throw new IOException("Failed to save file: " + e.getMessage(), e);
        }
    }
}