package com.project.app.friendship.service.impl;

import com.project.app.friendship.dto.response.FriendshipResponse;
import com.project.app.friendship.entity.Friendship;
import com.project.app.friendship.entity.FriendshipStatus;
import com.project.app.friendship.repository.FriendshipRepository;
import com.project.app.friendship.service.FriendshipService;
import com.project.app.notification.service.NotificationService;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendshipServiceImpl implements FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public FriendshipResponse sendFriendRequest(User currentUser, String receiverEmail) {
        if (currentUser.getEmail().equalsIgnoreCase(receiverEmail)) {
            throw new IllegalArgumentException("Không thể tự gửi lời mời kết bạn cho chính mình.");
        }

        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với email " + receiverEmail));

        // Check if a friendship or request already exists
        Optional<Friendship> existing = friendshipRepository.findFriendshipBetweenUsers(currentUser, receiver);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Đã tồn tại trạng thái kết bạn hoặc lời mời giữa hai người.");
        }

        Friendship friendship = new Friendship(currentUser, receiver, FriendshipStatus.PENDING);
        Friendship saved = friendshipRepository.save(friendship);

        notificationService.createNotification(
                receiver,
                "Lời mời kết bạn",
                currentUser.getUsername() + " đã gửi cho bạn một lời mời kết bạn."
        );

        return new FriendshipResponse(saved, currentUser);
    }

    @Override
    @Transactional
    public FriendshipResponse acceptFriendRequest(User currentUser, Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lời mời kết bạn."));

        if (!friendship.getReceiver().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Bạn chỉ có thể chấp nhận lời mời được gửi cho mình.");
        }

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new IllegalArgumentException("Lời mời kết bạn không ở trạng thái chờ duyệt.");
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        Friendship saved = friendshipRepository.save(friendship);

        notificationService.createNotification(
                friendship.getRequester(),
                "Kết bạn thành công",
                currentUser.getUsername() + " đã đồng ý lời mời kết bạn của bạn."
        );

        return new FriendshipResponse(saved, currentUser);
    }

    @Override
    public void rejectFriendRequest(User currentUser, Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lời mời kết bạn."));

        if (!friendship.getReceiver().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Bạn chỉ có thể từ chối lời mời được gửi cho mình.");
        }

        // We can either set status to REJECTED or delete it. Deleting is often cleaner.
        friendshipRepository.delete(friendship);
    }

    @Override
    public void removeFriend(User currentUser, Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dữ liệu bạn bè."));

        if (!friendship.getRequester().getId().equals(currentUser.getId()) &&
            !friendship.getReceiver().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Bạn không có quyền thực hiện hành động này.");
        }

        if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
            throw new IllegalArgumentException("Hai bạn chưa phải là bạn bè.");
        }

        friendshipRepository.delete(friendship);
    }

    @Override
    public List<FriendshipResponse> getFriendsList(User currentUser) {
        List<Friendship> friends = friendshipRepository.findAllFriends(currentUser, FriendshipStatus.ACCEPTED);
        return friends.stream()
                .map(f -> new FriendshipResponse(f, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    public List<FriendshipResponse> getPendingRequests(User currentUser) {
        List<Friendship> requests = friendshipRepository.findByReceiverAndStatus(currentUser, FriendshipStatus.PENDING);
        return requests.stream()
                .map(f -> new FriendshipResponse(f, currentUser))
                .collect(Collectors.toList());
    }
}
