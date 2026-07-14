package com.project.app.post.dto.response;

import com.project.app.post.entity.Post;

import java.time.LocalDateTime;

public class PostResponse {

    private Long id;
    private String title;
    private String imageUrl;
    private String targetLink;
    private boolean isActive;
    private LocalDateTime createdAt;

    public PostResponse() {}

    public PostResponse(Post post) {
        this.id = post.getId();
        this.title = post.getTitle();
        this.imageUrl = post.getImageUrl();
        this.targetLink = post.getTargetLink();
        this.isActive = post.isActive();
        this.createdAt = post.getCreatedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getTargetLink() { return targetLink; }
    public void setTargetLink(String targetLink) { this.targetLink = targetLink; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
