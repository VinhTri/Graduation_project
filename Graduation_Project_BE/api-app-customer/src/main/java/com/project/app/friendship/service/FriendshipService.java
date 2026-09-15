package com.project.app.friendship.service;

import com.project.app.friendship.dto.response.FriendshipResponse;
import com.project.app.friendship.dto.response.FriendshipRelationshipDto;
import com.project.app.user.entity.User;
import java.util.List;

public interface FriendshipService {
    FriendshipResponse sendFriendRequest(User currentUser, String receiverEmail);
    FriendshipResponse acceptFriendRequest(User currentUser, Long friendshipId);
    void rejectFriendRequest(User currentUser, Long friendshipId);
    void removeFriend(User currentUser, Long friendshipId);
    List<FriendshipResponse> getFriendsList(User currentUser);
    List<FriendshipResponse> getPendingRequests(User currentUser);
    List<FriendshipResponse> getSentPendingRequests(User currentUser);
    FriendshipRelationshipDto getRelationshipWithUser(User currentUser, User targetUser);
    void cancelSentFriendRequest(User currentUser, Long friendshipId);
}
