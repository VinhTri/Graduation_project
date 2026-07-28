package com.project.app.notification.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.notification.dto.response.NotificationResponse;
import com.project.app.notification.service.NotificationService;
import com.project.app.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUserNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<NotificationResponse> notifications = notificationService.getUserNotifications(userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.<List<NotificationResponse>>builder()
                .success(true)
                .message("Success")
                .data(notifications)
                .build());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long count = notificationService.getUnreadCount(userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.<Long>builder()
                .success(true)
                .message("Success")
                .data(count)
                .build());
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        notificationService.markAllAsRead(userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Success")
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        notificationService.deleteNotification(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Success")
                .build());
    }
}
