package com.project.app.friendship.repository;

import com.project.app.friendship.entity.Friendship;
import com.project.app.friendship.entity.FriendshipStatus;
import com.project.app.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    // Check if friendship exists between two users
    @Query("SELECT f FROM Friendship f WHERE (f.requester = :user1 AND f.receiver = :user2) OR (f.requester = :user2 AND f.receiver = :user1)")
    Optional<Friendship> findFriendshipBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);

    // Get all friends (ACCEPTED status)
    @Query("SELECT f FROM Friendship f WHERE (f.requester = :user OR f.receiver = :user) AND f.status = :status")
    List<Friendship> findAllFriends(@Param("user") User user, @Param("status") FriendshipStatus status);

    // Get all pending requests received by a user
    List<Friendship> findByReceiverAndStatus(User receiver, FriendshipStatus status);
}
