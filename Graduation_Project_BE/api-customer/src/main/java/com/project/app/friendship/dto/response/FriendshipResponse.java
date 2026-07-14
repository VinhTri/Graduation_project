package com.project.app.friendship.dto.response;

import com.project.app.friendship.entity.Friendship;
import com.project.app.user.entity.User;
import java.time.LocalDateTime;

public class FriendshipResponse {
    private Long id;
    private Long friendId;
    private String friendUsername;
    private String friendEmail;
    private String status;
    private LocalDateTime createdAt;
    // To identify if the current user is the requester or receiver
    private boolean isRequester;

    public FriendshipResponse() {}

    public FriendshipResponse(Friendship friendship, User currentUser) {
        this.id = friendship.getId();
        this.status = friendship.getStatus().name();
        this.createdAt = friendship.getCreatedAt();
        
        if (friendship.getRequester().getId().equals(currentUser.getId())) {
            this.isRequester = true;
            this.friendId = friendship.getReceiver().getId();
            this.friendUsername = friendship.getReceiver().getUsername();
            this.friendEmail = friendship.getReceiver().getEmail();
        } else {
            this.isRequester = false;
            this.friendId = friendship.getRequester().getId();
            this.friendUsername = friendship.getRequester().getUsername();
            this.friendEmail = friendship.getRequester().getEmail();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFriendId() { return friendId; }
    public void setFriendId(Long friendId) { this.friendId = friendId; }

    public String getFriendUsername() { return friendUsername; }
    public void setFriendUsername(String friendUsername) { this.friendUsername = friendUsername; }

    public String getFriendEmail() { return friendEmail; }
    public void setFriendEmail(String friendEmail) { this.friendEmail = friendEmail; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isRequester() { return isRequester; }
    public void setRequester(boolean requester) { isRequester = requester; }
}
