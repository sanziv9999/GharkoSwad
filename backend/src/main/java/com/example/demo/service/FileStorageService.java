package com.example.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);
    private static final String UPLOAD_DIR = "uploads/";
    private static final String IMAGES_DIR = "images/";
    private static final String VIDEOS_DIR = "videos/";
    private static final String[] ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg"};
    private static final String[] ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm"};

    public String storeFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            logger.warn("Empty file provided for upload");
            return null;
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            logger.warn("Unknown file type: No content type detected");
            throw new IllegalArgumentException("Unknown file type");
        }

        String directory;
        if (Arrays.asList(ALLOWED_IMAGE_TYPES).contains(contentType)) {
            directory = IMAGES_DIR;
        } else if (Arrays.asList(ALLOWED_VIDEO_TYPES).contains(contentType)) {
            directory = VIDEOS_DIR;
        } else {
            logger.warn("Invalid file type: {}. Only images ({}) or videos ({}) are allowed",
                    contentType, String.join(", ", ALLOWED_IMAGE_TYPES), String.join(", ", ALLOWED_VIDEO_TYPES));
            throw new IllegalArgumentException("Invalid file type. Only images (jpeg, png, jpg) or videos (mp4, webm) are allowed");
        }

        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get(UPLOAD_DIR + directory).toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        logger.info("File successfully saved with path: {}{}", directory, fileName);
        return directory + fileName;
    }
}