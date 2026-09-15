package com.project.app.notification.service.admin;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.notification.dto.request.AdminNotificationRequest;
import com.project.app.notification.entity.Notification;
import com.project.app.notification.enums.NotificationType;
import com.project.app.notification.repository.NotificationRepository;
import com.project.app.user.entity.Role;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminNotificationService {
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Transactional
    public int send(AdminNotificationRequest request) {
        List<User> receivers;
        if ("USER".equals(request.getAudience())) {
            if (request.getUserId() == null) throw new AppException(ErrorCode.INVALID_REQUEST);
            User user = userRepository.findById(request.getUserId())
                    .filter(item -> item.getRole() == Role.USER)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            receivers = List.of(user);
        } else {
            receivers = userRepository.findAll().stream()
                    .filter(user -> user.getRole() == Role.USER && user.isActive())
                    .toList();
        }

        String title = request.getTitle().trim();
        String message = request.getMessage().trim();
        LocalDateTime now = LocalDateTime.now();
        List<Notification> notifications = receivers.stream().map(user -> Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(NotificationType.GENERAL)
                .isRead(false)
                .createdAt(now)
                .build()).toList();
        notificationRepository.saveAll(notifications);
        return notifications.size();
    }
}
