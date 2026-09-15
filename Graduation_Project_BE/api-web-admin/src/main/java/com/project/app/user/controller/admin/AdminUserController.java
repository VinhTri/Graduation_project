package com.project.app.user.controller.admin;

import com.project.app.common.dto.ApiResponse;
import com.project.app.audit.service.AdminAuditService;
import com.project.app.auth.security.CustomUserDetails;
import com.project.app.user.dto.response.UserDetailsResponse;
import com.project.app.user.dto.response.UserResponse;
import com.project.app.user.dto.response.AdminTransactionPageResponse;
import com.project.app.user.dto.request.AdminUserStatusRequest;
import jakarta.validation.Valid;
import com.project.app.user.service.admin.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService userService;
    private final AdminAuditService auditService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.<List<UserResponse>>builder()
                .success(true)
                .message("Lấy danh sách người dùng thành công")
                .data(users)
                .build());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AdminUserStatusRequest request) {
        userService.updateUserStatus(id, request.getActive());
        auditService.record(userDetails.getUser(), "USER_STATUS_UPDATE", "USER", id,
                (request.getActive() ? "Mở khóa: " : "Khóa: ") + request.getReason().trim());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã cập nhật trạng thái người dùng")
                .build());
    }

    @GetMapping("/{id}/details")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDetailsResponse>> getUserDetails(@PathVariable Long id) {
        UserDetailsResponse details = userService.getUserDetailsForAdmin(id);
        return ResponseEntity.ok(ApiResponse.<UserDetailsResponse>builder()
                .success(true)
                .message("Lấy thông tin chi tiết người dùng thành công")
                .data(details)
                .build());
    }

    @GetMapping("/{id}/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminTransactionPageResponse>> getUserTransactions(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.<AdminTransactionPageResponse>builder()
                .success(true).message("Lấy lịch sử giao dịch người dùng thành công")
                .data(userService.getUserTransactions(id, page, size)).build());
    }
}
