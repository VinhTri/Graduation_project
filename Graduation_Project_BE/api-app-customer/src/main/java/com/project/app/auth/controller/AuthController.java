package com.project.app.auth.controller;

import com.project.app.auth.dto.request.ChangePasswordRequest;
import com.project.app.auth.dto.request.ChangePinRequest;
import com.project.app.auth.dto.request.LoginRequest;
import com.project.app.auth.dto.request.RegisterRequest;
import com.project.app.auth.dto.request.ResetPasswordRequest;
import com.project.app.auth.dto.request.ResetPinRequest;
import com.project.app.auth.dto.request.SendOtpRequest;
import com.project.app.auth.dto.request.SetupPinRequest;
import com.project.app.auth.dto.request.VerifyOtpRequest;
import com.project.app.auth.dto.request.VerifyPinRequest;
import com.project.app.auth.dto.request.UnlockAccountRequest;
import com.project.app.auth.dto.response.AuthResponse;
import com.project.app.auth.security.CustomUserDetails;
import com.project.app.auth.service.AuthService;
import com.project.app.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Auth API cho cổng Customer (app).
 * <p>
 * Public (không JWT): login, register, gửi/xác thực OTP đăng ký & quên mật khẩu.<br>
 * Cần JWT: đổi mật khẩu, toàn bộ nghiệp vụ PIN.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ====================== ĐĂNG NHẬP ======================

    /** Đăng nhập bằng email + mật khẩu → trả JWT. */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Đăng nhập thành công!", authService.loginUser(request));
    }

    @PostMapping("/unlock/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendUnlockOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendUnlockOtp(request);
        return ApiResponse.ok("Mã OTP mở khóa đã được gửi đến email của bạn!");
    }

    @PostMapping("/unlock")
    public ResponseEntity<ApiResponse<Void>> unlock(@Valid @RequestBody UnlockAccountRequest request) {
        authService.unlockAccount(request);
        return ApiResponse.ok("Mở khóa tài khoản thành công!");
    }

    // ====================== ĐĂNG KÝ ======================

    /** Gửi OTP đăng ký về email ({@code OtpPurpose.REGISTER}). */
    @PostMapping("/register/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendRegisterOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendRegisterOtp(request);
        return ApiResponse.ok("Mã OTP đã được gửi đến email của bạn!");
    }

    /** Xác thực OTP đăng ký + tạo tài khoản (tên = phần trước @ của email) → trả JWT. */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("Đăng ký tài khoản thành công!", authService.registerUser(request));
    }

    // ====================== MẬT KHẨU ======================

    /** Gửi OTP quên mật khẩu ({@code OtpPurpose.RESET_PASSWORD}). */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody SendOtpRequest request) {
        authService.processForgotPassword(request);
        return ApiResponse.ok("Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn!");
    }

    /** Đặt lại mật khẩu bằng email + OTP + mật khẩu mới. */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.processResetPassword(request);
        return ApiResponse.ok("Đặt lại mật khẩu thành công!");
    }

    /** Đổi mật khẩu khi đã đăng nhập (cần mật khẩu cũ). Yêu cầu JWT. */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getUser().getId(), request);
        return ApiResponse.ok("Đổi mật khẩu thành công!");
    }

    // ====================== MÃ PIN ======================

    /** Kiểm tra user đã có PIN chưa. Yêu cầu JWT. */
    @GetMapping("/pin-status")
    public ResponseEntity<ApiResponse<Boolean>> getPinStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(
                "Lấy trạng thái mã PIN thành công",
                authService.hasPinCode(userDetails.getUser().getId()));
    }

    /** Lần đầu tạo PIN (chỉ khi chưa có PIN). Yêu cầu JWT. */
    @PostMapping("/setup-pin")
    public ResponseEntity<ApiResponse<Void>> setupPin(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody SetupPinRequest request) {
        authService.setupPinCode(userDetails.getUser().getId(), request.getPinCode());
        return ApiResponse.ok("Cài đặt mã PIN thành công");
    }

    /** Gửi OTP quên PIN về email user ({@code OtpPurpose.RESET_PIN}). Yêu cầu JWT. */
    @PostMapping("/forgot-pin")
    public ResponseEntity<ApiResponse<Void>> forgotPin(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        authService.sendForgotPinOtp(userDetails.getUser().getId());
        return ApiResponse.ok("Mã OTP khôi phục mã PIN đã được gửi đến email của bạn!");
    }

    /** Đặt lại PIN bằng OTP + PIN mới (sau forgot-pin). Yêu cầu JWT. */
    @PostMapping("/reset-pin")
    public ResponseEntity<ApiResponse<Void>> resetPin(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ResetPinRequest request) {
        authService.resetPinCode(
                userDetails.getUser().getId(),
                request.getOtp(),
                request.getNewPinCode());
        return ApiResponse.ok("Đặt lại mã PIN thành công");
    }

    /** Đổi PIN khi nhớ PIN cũ (không dùng OTP). Yêu cầu JWT. */
    @PostMapping("/change-pin")
    public ResponseEntity<ApiResponse<Void>> changePin(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePinRequest request) {
        authService.changePinCode(userDetails.getUser().getId(), request);
        return ApiResponse.ok("Đổi mã PIN thành công");
    }

    /** Kiểm tra PIN nhập vào có đúng không. Yêu cầu JWT. */
    @PostMapping("/verify-pin")
    public ResponseEntity<ApiResponse<Boolean>> verifyPin(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody VerifyPinRequest request) {
        boolean isValid = authService.verifyPinCode(userDetails.getUser().getId(), request.getPinCode());
        if (!isValid) {
            return ResponseEntity.ok(ApiResponse.failure("Mã PIN không chính xác", false));
        }
        return ApiResponse.ok("Xác nhận mã PIN thành công", true);
    }

    // ====================== OTP DÙNG CHUNG ======================

    /**
     * Kiểm tra OTP có hợp lệ theo {@code purpose} (REGISTER / RESET_PASSWORD / RESET_PIN).
     * Chỉ preview — không đánh dấu đã dùng; không cấp JWT.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ApiResponse.ok("Mã OTP hợp lệ!");
    }
}
