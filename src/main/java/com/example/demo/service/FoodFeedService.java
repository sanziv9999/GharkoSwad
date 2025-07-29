package com.example.demo.service;

import com.example.demo.model.Comment;
import com.example.demo.model.FoodFeed;
import com.example.demo.model.FeedType;
import com.example.demo.model.Recipe;
import com.example.demo.model.User;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.FoodFeedRepository;
import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class FoodFeedService {

    private static final Logger logger = LoggerFactory.getLogger(FoodFeedService.class);

    @Autowired
    private FoodFeedRepository foodFeedRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private FileStorageService fileStorageService;

    @Transactional
    public FoodFeed createFoodFeed(Long chefId, String content, MultipartFile image, MultipartFile video, Recipe recipe, FeedType type) throws IOException {
        logger.info("Creating food feed for chefId: {}, type: {}", chefId, type);
        User chef = userService.findById(chefId);
        if (!"CHEF".equals(chef.getRole())) {
            throw new IllegalArgumentException("Only chefs can create feed posts");
        }

        String imagePath = null;
        if (image != null && !image.isEmpty()) {
            imagePath = fileStorageService.storeFile(image);
        }

        String videoPath = null;
        if (video != null && !video.isEmpty()) {
            videoPath = fileStorageService.storeFile(video);
        }

        if ((type == FeedType.IMAGE && imagePath == null) || (type == FeedType.VIDEO && videoPath == null)) {
            throw new IllegalArgumentException("Image is required for IMAGE type or Video is required for VIDEO type");
        }

        FoodFeed feed = new FoodFeed(chef, content, imagePath, videoPath, recipe, type);
        return foodFeedRepository.save(feed);
    }

    @Transactional
    public Comment addComment(Long feedId, Long userId, String text) {
        logger.info("Adding comment to feedId: {}, userId: {}", feedId, userId);
        FoodFeed feed = foodFeedRepository.findById(feedId)
                .orElseThrow(() -> new IllegalArgumentException("Feed post not found: " + feedId));
        User user = userService.findById(userId);
        Comment comment = new Comment(user, text);
        feed.addComment(comment);
        return commentRepository.save(comment);
    }

    @Transactional
    public boolean toggleLike(Long feedId, Long userId) {
        logger.info("Toggling like for feedId: {}, userId: {}", feedId, userId);
        FoodFeed feed = foodFeedRepository.findById(feedId)
                .orElseThrow(() -> new IllegalArgumentException("Feed post not found: " + feedId));
        if (feed.addLike(userId)) {
            foodFeedRepository.save(feed);
            return true;
        } else {
            feed.removeLike(userId);
            foodFeedRepository.save(feed);
            return false;
        }
    }

    public FoodFeed getFoodFeed(Long id) {
        logger.info("Retrieving food feed with id: {}", id);
        FoodFeed feed = foodFeedRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Feed post not found: " + id));
        Hibernate.initialize(feed.getChef());
        Hibernate.initialize(feed.getComments());
        return feed;
    }

    @Transactional(readOnly = true)
    public List<FoodFeed> getAllFoodFeeds() {
        logger.info("Retrieving all food feed posts");
        List<FoodFeed> feeds = foodFeedRepository.findAll();
        feeds.forEach(feed -> {
            Hibernate.initialize(feed.getChef());
            Hibernate.initialize(feed.getComments());
        });
        return feeds;
    }
}