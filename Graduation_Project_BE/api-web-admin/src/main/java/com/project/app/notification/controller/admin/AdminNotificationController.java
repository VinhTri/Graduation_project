package com.project.app.notification.controller.admin;

import com.project.app.audit.service.AdminAuditService;
import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.notification.dto.request.AdminNotificationRequest;
import com.project.app.notification.service.admin.AdminNotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {
    private final AdminNotificationService service;
    private final AdminAuditService auditService;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> send(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AdminNotificationRequest request) {
        int recipients = service.send(request);
        auditService.record(userDetails.getUser(), "NOTIFICATION_SEND", "NOTIFICATION", request.getUserId(),
                "Gửi thông báo tới " + recipients + " người dùng; phạm vi " + request.getAudience());
        return ResponseEntity.ok(ApiResponse.<Map<String, Integer>>builder()
                .success(true).message("Đã gửi thông báo tới " + recipients + " người dùng")
                .data(Map.of("recipients", recipients)).build());
    }
}
