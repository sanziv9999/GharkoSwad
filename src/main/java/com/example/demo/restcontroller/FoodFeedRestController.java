package com.example.demo.restcontroller;

import com.example.demo.dto.UserDto;
import com.example.demo.model.FoodFeed;
import com.example.demo.model.FeedType;
import com.example.demo.model.Recipe;
import com.example.demo.model.UserProfile;
import com.example.demo.service.FoodFeedService;
import com.example.demo.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/food-feed")
public class FoodFeedRestController {

    private static final Logger logger = LoggerFactory.getLogger(FoodFeedRestController.class);

    @Autowired
    private FoodFeedService foodFeedService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createFoodFeed(
            @RequestParam("chefId") Long chefId,
            @RequestParam("content") String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "video", required = false) MultipartFile video,
            @RequestParam(value = "recipeName", required = false) String recipeName,
            @RequestParam(value = "ingredients", required = false) String ingredients,
            @RequestParam(value = "instructions", required = false) String instructions,
            @RequestParam(value = "cookingTime", required = false) String cookingTime,
            @RequestParam(value = "serves", required = false) String serves,
            @RequestParam(value = "difficulty", required = false) String difficulty,
            @RequestParam("type") FeedType type) throws IOException {
        Map<String, Object> response = new HashMap<>();
        logger.info("Creating food feed post for chefId: {}, type: {}", chefId, type);
        try {
            Recipe recipe = null;
            if (type == FeedType.RECIPE) {
                if (recipeName == null || ingredients == null || cookingTime == null || serves == null) {
                    throw new IllegalArgumentException("Recipe details are required for RECIPE type");
                }
                recipe = new Recipe(recipeName, ingredients, instructions, cookingTime, serves, difficulty);
            }

            FoodFeed feed = foodFeedService.createFoodFeed(chefId, content, image, video, recipe, type);
            response.put("status", "success");
            response.put("message", "Food feed post created successfully");
            response.put("data", Map.of(
                "id", feed.getId(),
                "content", feed.getContent(),
                "type", feed.getType()
            ));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (IOException e) {
            response.put("status", "error");
            response.put("message", "Failed to upload file: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/{feedId}/comments")
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable Long feedId,
            @RequestParam("userId") Long userId,
            @RequestParam("text") String text) {
        Map<String, Object> response = new HashMap<>();
        logger.info("Adding comment to feedId: {}, userId: {}", feedId, userId);
        try {
            foodFeedService.addComment(feedId, userId, text);
            response.put("status", "success");
            response.put("message", "Comment added successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/{feedId}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long feedId,
            @RequestParam("userId") Long userId) {
        Map<String, Object> response = new HashMap<>();
        logger.info("Toggling like for feedId: {}, userId: {}", feedId, userId);
        try {
            boolean liked = foodFeedService.toggleLike(feedId, userId);
            response.put("status", "success");
            response.put("message", liked ? "Post liked" : "Like removed");
            response.put("liked", liked);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getFoodFeed(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        logger.info("Retrieving food feed post with id: {}", id);
        try {
            FoodFeed feed = foodFeedService.getFoodFeed(id);
            response.put("status", "success");
            response.put("message", "Food feed post retrieved successfully");
            Map<String, Object> data = new HashMap<>();
            data.put("id", feed.getId());
            data.put("content", feed.getContent());
            data.put("type", feed.getType());
            data.put("createdAt", feed.getCreatedAt());
            if (feed.getImagePath() != null) data.put("imagePath", "/" + feed.getImagePath());
            if (feed.getVideoPath() != null) data.put("videoPath", "/" + feed.getVideoPath());
            if (feed.getRecipe() != null) {
                data.put("recipe", Map.of(
                    "name", feed.getRecipe().getName(),
                    "ingredients", feed.getRecipe().getIngredients(),
                    "cookingTime", feed.getRecipe().getCookingTime(),
                    "serves", feed.getRecipe().getServes(),
                    "difficulty", feed.getRecipe().getDifficulty()
                ));
            }
            data.put("likes", feed.getLikes().stream().collect(Collectors.toList()));
            data.put("comments", feed.getComments().stream().map(comment -> {
                Map<String, Object> commentData = new HashMap<>();
                commentData.put("id", comment.getId());
                commentData.put("userId", comment.getUser().getId());
                commentData.put("text", comment.getText());
                commentData.put("createdAt", comment.getCreatedAt());
                UserProfile userProfile = userService.findUserProfileByUserId(comment.getUser().getId());
                UserDto userDto = new UserDto();
                userDto.setUsername(comment.getUser().getUsername());
                if (userProfile != null) {
                    userDto.setProfilePicture(userProfile.getProfilePicture());
                }
                commentData.put("user", userDto);
                return commentData;
            }).collect(Collectors.toList()));
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllFoodFeeds() {
        Map<String, Object> response = new HashMap<>();
        logger.info("Retrieving all food feed posts");
        try {
            List<FoodFeed> feeds = foodFeedService.getAllFoodFeeds();
            response.put("status", "success");
            response.put("message", "All food feed posts retrieved successfully");
            response.put("data", feeds.stream().map(feed -> {
                Map<String, Object> feedData = new HashMap<>();
                feedData.put("id", feed.getId());
                feedData.put("content", feed.getContent());
                feedData.put("type", feed.getType());
                feedData.put("createdAt", feed.getCreatedAt());
                if (feed.getImagePath() != null) feedData.put("imagePath", "/" + feed.getImagePath());
                if (feed.getVideoPath() != null) feedData.put("videoPath", "/" + feed.getVideoPath());
                if (feed.getRecipe() != null) {
                    feedData.put("recipe", Map.of(
                        "name", feed.getRecipe().getName(),
                        "ingredients", feed.getRecipe().getIngredients(),
                        "cookingTime", feed.getRecipe().getCookingTime(),
                        "serves", feed.getRecipe().getServes(),
                        "difficulty", feed.getRecipe().getDifficulty()
                    ));
                }
                feedData.put("likes", feed.getLikes().stream().collect(Collectors.toList()));
                feedData.put("comments", feed.getComments().stream().map(comment -> {
                    Map<String, Object> commentData = new HashMap<>();
                    commentData.put("id", comment.getId());
                    commentData.put("userId", comment.getUser().getId());
                    commentData.put("text", comment.getText());
                    commentData.put("createdAt", comment.getCreatedAt());
                    UserProfile userProfile = userService.findUserProfileByUserId(comment.getUser().getId());
                    UserDto userDto = new UserDto();
                    userDto.setUsername(comment.getUser().getUsername());
                    if (userProfile != null) {
                        userDto.setProfilePicture(userProfile.getProfilePicture());
                    }
                    commentData.put("user", userDto);
                    return commentData;
                }).collect(Collectors.toList()));

                // Convert User and UserProfile to UserDto for chef
                UserDto chefDto = new UserDto();
                chefDto.setUsername(feed.getChef().getUsername());
                UserProfile chefProfile = userService.findUserProfileByUserId(feed.getChef().getId());
                if (chefProfile != null) {
                    chefDto.setProfilePicture(chefProfile.getProfilePicture());
                }
                feedData.put("chef", chefDto);

                return feedData;
            }).collect(Collectors.toList()));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Failed to fetch all food feeds: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}