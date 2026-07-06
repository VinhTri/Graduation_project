package com.project.app.notification.service;

import com.project.app.notification.dto.response.NotificationResponse;
import com.project.app.user.entity.User;

import java.util.List;

public interface NotificationService {
    void createNotification(User user, String title, String message);
    List<NotificationResponse> getUserNotifications(User user);
    long getUnreadCount(User user);
    void markAllAsRead(User user);
}
