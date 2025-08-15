package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "food_feeds")
public class FoodFeed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chef_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User chef;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "image_path")
    private String imagePath;

    @Column(name = "video_path")
    private String videoPath;

    @Embedded
    private Recipe recipe;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "type", nullable = false)
    @Enumerated(EnumType.STRING)
    private FeedType type;

    @OneToMany(mappedBy = "foodFeed", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<Comment> comments = new ArrayList<>();

    @ElementCollection
    @Column(name = "user_id")
    private Set<Long> likes = new HashSet<>();

    // Constructors
    public FoodFeed() {
        this.createdAt = LocalDateTime.now();
    }

    public FoodFeed(User chef, String content, String imagePath, String videoPath, Recipe recipe, FeedType type) {
        this.chef = chef;
        this.content = content;
        this.imagePath = imagePath;
        this.videoPath = videoPath;
        this.recipe = recipe;
        this.type = type;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getChef() { return chef; }
    public void setChef(User chef) { this.chef = chef; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }
    public String getVideoPath() { return videoPath; }
    public void setVideoPath(String videoPath) { this.videoPath = videoPath; }
    public Recipe getRecipe() { return recipe; }
    public void setRecipe(Recipe recipe) { this.recipe = recipe; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public FeedType getType() { return type; }
    public void setType(FeedType type) { this.type = type; }
    public List<Comment> getComments() { return comments; }
    public void setComments(List<Comment> comments) { this.comments = comments; }
    public Set<Long> getLikes() { return likes; }
    public void setLikes(Set<Long> likes) { this.likes = likes; }

    // Business methods
    public void addComment(Comment comment) {
        comments.add(comment);
        comment.setFoodFeed(this);
    }

    public void removeComment(Comment comment) {
        comments.remove(comment);
        comment.setFoodFeed(null);
    }

    public boolean addLike(Long userId) {
        return likes.add(userId);
    }

    public boolean removeLike(Long userId) {
        return likes.remove(userId);
    }
}