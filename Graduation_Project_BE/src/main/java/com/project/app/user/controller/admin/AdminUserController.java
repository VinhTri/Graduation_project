package com.project.app.user.controller.admin;

import com.project.app.common.dto.ApiResponse;
import com.project.app.user.dto.response.UserDetailsResponse;
import com.project.app.user.dto.response.UserResponse;
import com.project.app.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

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

    @PutMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(@PathVariable Long id) {
        userService.toggleUserStatus(id);
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
}
