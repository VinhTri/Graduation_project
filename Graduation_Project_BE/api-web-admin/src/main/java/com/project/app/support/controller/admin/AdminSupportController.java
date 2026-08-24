package com.project.app.support.controller.admin;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.audit.service.AdminAuditService;
import com.project.app.common.dto.ApiResponse;
import com.project.app.support.dto.request.SupportReplyRequest;
import com.project.app.support.dto.request.SupportStatusRequest;
import com.project.app.support.dto.response.SupportMessageResponse;
import com.project.app.support.dto.response.SupportTicketDetailResponse;
import com.project.app.support.dto.response.SupportTicketResponse;
import com.project.app.support.service.admin.AdminSupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/support")
@RequiredArgsConstructor
public class AdminSupportController {

    private final AdminSupportService adminSupportService;
    private final AdminAuditService auditService;

    @GetMapping("/tickets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SupportTicketResponse>>> getAllTickets() {
        return ResponseEntity.ok(ApiResponse.<List<SupportTicketResponse>>builder()
                .success(true)
                .message("Lấy danh sách hỗ trợ thành công")
                .data(adminSupportService.getAllTickets())
                .build());
    }

    @GetMapping("/tickets/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SupportTicketDetailResponse>> getTicketDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<SupportTicketDetailResponse>builder()
                .success(true)
                .message("Lấy chi tiết yêu cầu hỗ trợ thành công")
                .data(adminSupportService.getTicketDetail(id))
                .build());
    }

    @PostMapping("/tickets/{id}/reply")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SupportMessageResponse>> reply(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody SupportReplyRequest request
    ) {
        SupportMessageResponse response = adminSupportService.reply(id, userDetails.getUser(), request);
        auditService.record(userDetails.getUser(), "SUPPORT_REPLY", "SUPPORT_TICKET", id,
                "Phản hồi yêu cầu hỗ trợ");
        return ResponseEntity.ok(ApiResponse.<SupportMessageResponse>builder()
                .success(true)
                .message("Đã gửi phản hồi")
                .data(response)
                .build());
    }

    @PutMapping("/tickets/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody SupportStatusRequest request
    ) {
        SupportTicketResponse response = adminSupportService.updateStatus(id, request);
        auditService.record(userDetails.getUser(), "SUPPORT_STATUS_UPDATE", "SUPPORT_TICKET", id,
                "Cập nhật trạng thái thành " + request.getStatus());
        return ResponseEntity.ok(ApiResponse.<SupportTicketResponse>builder()
                .success(true)
                .message("Đã cập nhật trạng thái")
                .data(response)
                .build());
    }
}
