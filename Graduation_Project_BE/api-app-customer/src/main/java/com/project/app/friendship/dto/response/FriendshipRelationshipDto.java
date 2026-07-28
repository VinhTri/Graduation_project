package com.project.app.friendship.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.project.app.friendship.entity.Friendship;
import com.project.app.friendship.entity.FriendshipStatus;
import com.project.app.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendshipRelationshipDto {
    private String friendshipStatus;
    private Long friendshipId;

    @JsonProperty("requester")
    private boolean isRequester;

    public static FriendshipRelationshipDto none() {
        return FriendshipRelationshipDto.builder()
                .friendshipStatus("NONE")
                .build();
    }

    public static FriendshipRelationshipDto from(Friendship friendship, User currentUser) {
        return FriendshipRelationshipDto.builder()
                .friendshipStatus(friendship.getStatus().name())
                .friendshipId(friendship.getId())
                .isRequester(friendship.getRequester().getId().equals(currentUser.getId()))
                .build();
    }

    public static FriendshipRelationshipDto accepted(Long friendshipId, boolean isRequester) {
        return FriendshipRelationshipDto.builder()
                .friendshipStatus(FriendshipStatus.ACCEPTED.name())
                .friendshipId(friendshipId)
                .isRequester(isRequester)
                .build();
    }
}
