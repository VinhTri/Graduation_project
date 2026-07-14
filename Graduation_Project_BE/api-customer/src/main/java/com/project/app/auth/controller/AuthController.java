package com.project.app.auth.controller;

import com.project.app.auth.dto.request.*;
import com.project.app.auth.dto.response.AuthResponse;
import com.project.app.auth.service.AuthService;
import com.project.app.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.project.app.auth.security.CustomUserDetails;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ====================== ĐĂNG NHẬP ======================
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.loginUser(request);
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Đăng nhập thành công!")
                .data(response)
                .build());
    }

    // ====================== ĐĂNG KÝ ======================
    @PostMapping("/register/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendRegisterOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendRegisterOtp(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Mã OTP đã được gửi đến email của bạn!")
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerUser(request);
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Đăng ký tài khoản thành công!")
                .data(response)
                .build());
    }

    // ====================== QUÊN MẬT KHẨU ======================
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody SendOtpRequest request) {
        authService.processForgotPassword(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn!")
                .build());
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.processResetPassword(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đặt lại mật khẩu thành công!")
                .build());
    }

    // ====================== MÃ PIN ======================
    @GetMapping("/pin-status")
    public ResponseEntity<ApiResponse<Boolean>> getPinStatus(@AuthenticationPrincipal CustomUserDetails userDetails) {
        boolean hasPin = authService.hasPinCode(userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .success(true)
                .message("Lấy trạng thái mã PIN thành công")
                .data(hasPin)
                .build());
    }

    @PostMapping("/setup-pin")
    public ResponseEntity<ApiResponse<Void>> setupPin(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody java.util.Map<String, String> request) {
        String pinCode = request.get("pinCode");
        if (pinCode == null || pinCode.length() != 6) {
            return ResponseEntity.badRequest().body(ApiResponse.<Void>builder()
                    .success(false)
                    .message("Mã PIN phải có 6 chữ số")
                    .build());
        }
        authService.setupPinCode(userDetails.getUser().getId(), pinCode);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Cài đặt mã PIN thành công")
                .build());
    }

    @PostMapping("/forgot-pin")
    public ResponseEntity<ApiResponse<Void>> forgotPin(@AuthenticationPrincipal CustomUserDetails userDetails) {
        authService.sendForgotPinOtp(userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Mã OTP khôi phục mã PIN đã được gửi đến email của bạn!")
                .build());
    }

    @PostMapping("/reset-pin")
    public ResponseEntity<ApiResponse<Void>> resetPin(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody java.util.Map<String, String> request) {
        String otp = request.get("otp");
        String newPinCode = request.get("newPinCode");
        
        if (newPinCode == null || newPinCode.length() != 6) {
            return ResponseEntity.badRequest().body(ApiResponse.<Void>builder()
                    .success(false)
                    .message("Mã PIN mới phải có 6 chữ số")
                    .build());
        }
        
        authService.resetPinCode(userDetails.getUser().getId(), otp, newPinCode);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đặt lại mã PIN thành công")
                .build());
    }

    @PostMapping("/verify-pin")
    public ResponseEntity<ApiResponse<Boolean>> verifyPin(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody java.util.Map<String, String> request) {
        String pinCode = request.get("pinCode");
        if (pinCode == null || pinCode.length() != 6) {
            return ResponseEntity.badRequest().body(ApiResponse.<Boolean>builder()
                    .success(false)
                    .message("Mã PIN phải có 6 chữ số")
                    .data(false)
                    .build());
        }
        boolean isValid = authService.verifyPinCode(userDetails.getUser().getId(), pinCode);
        if (!isValid) {
            return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                    .success(false)
                    .message("Mã PIN không chính xác")
                    .data(false)
                    .build());
        }
        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .success(true)
                .message("Xác nhận mã PIN thành công")
                .data(true)
                .build());
    }

    // ====================== DÙNG CHUNG ======================
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Mã OTP hợp lệ!")
                .build());
    }
}
