package com.project.app.auth.controller;

import com.project.app.auth.dto.request.LoginRequest;
import com.project.app.auth.dto.response.AuthResponse;
import com.project.app.auth.service.AuthService;
import com.project.app.common.dto.ApiResponse;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.user.entity.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Auth API cho cổng Web Admin.
 * <p>
 * Chỉ expose đăng nhập quản trị — nghiệp vụ auth dùng chung {@link AuthService} trong core.
 * Sau login phải có role {@link Role#ADMIN}, nếu không sẽ bị từ chối.
 */
@RestController
@RequestMapping("/api/v1/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AuthService authService;

    /** Đăng nhập admin bằng email + mật khẩu → trả JWT (chỉ khi role = ADMIN). */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.loginUser(request);

        if (response.getRole() == null || !Role.ADMIN.name().equals(response.getRole())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        return ApiResponse.ok("Đăng nhập quản trị thành công!", response);
    }
}
