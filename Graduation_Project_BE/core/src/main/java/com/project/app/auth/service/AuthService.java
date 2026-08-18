package com.project.app.auth.service;

import com.project.app.auth.dto.request.ChangePasswordRequest;
import com.project.app.auth.dto.request.ChangePinRequest;
import com.project.app.auth.dto.request.LoginRequest;
import com.project.app.auth.dto.request.RegisterRequest;
import com.project.app.auth.dto.request.ResetPasswordRequest;
import com.project.app.auth.dto.request.SendOtpRequest;
import com.project.app.auth.dto.request.VerifyOtpRequest;
import com.project.app.auth.dto.response.AuthResponse;

/**
 * Nghiệp vụ xác thực: đăng nhập/đăng ký, mật khẩu, PIN, OTP.
 */
public interface AuthService {

    // ---- Đăng nhập / Đăng ký ----

    /** Đăng nhập bằng email + mật khẩu → JWT. */
    AuthResponse loginUser(LoginRequest request);

    /** Gửi OTP đăng ký ({@code REGISTER}) nếu email chưa tồn tại. */
    void sendRegisterOtp(SendOtpRequest request);

    /**
     * Xác thực OTP đăng ký, tạo user (tên = phần trước {@code @} của email),
     * tạo ví mặc định + ví tiền mặt → JWT.
     */
    AuthResponse registerUser(RegisterRequest request);

    // ---- Mật khẩu ----

    /** Gửi OTP quên mật khẩu ({@code RESET_PASSWORD}). */
    void processForgotPassword(SendOtpRequest request);

    /** Đặt lại mật khẩu bằng email + OTP + mật khẩu mới. */
    void processResetPassword(ResetPasswordRequest request);

    /** Đổi mật khẩu khi đã đăng nhập (cần mật khẩu cũ). */
    void changePassword(Long userId, ChangePasswordRequest request);

    /** Xác minh mật khẩu hiện tại (bước đầu flow đổi mật khẩu). */
    void verifyCurrentPassword(Long userId, String currentPassword);

    // ---- PIN ----

    /** User đã có PIN hay chưa. */
    boolean hasPinCode(Long userId);

    /** Lần đầu tạo PIN (chỉ khi chưa có). */
    void setupPinCode(Long userId, String pinCode);

    /** Gửi OTP quên PIN ({@code RESET_PIN}). */
    void sendForgotPinOtp(Long userId);

    /** Đặt lại PIN bằng OTP + PIN mới. */
    void resetPinCode(Long userId, String otp, String newPinCode);

    /** Kiểm tra PIN có khớp không. */
    boolean verifyPinCode(Long userId, String pinCode);

    /** Xác minh PIN hiện tại — ném lỗi nếu sai. */
    void verifyCurrentPin(Long userId, String currentPinCode);

    /** Đổi PIN khi nhớ PIN cũ (không OTP). */
    void changePinCode(Long userId, ChangePinRequest request);

    // ---- OTP dùng chung ----

    /**
     * Preview OTP theo {@code purpose} — không đánh dấu đã dùng, không cấp JWT.
     */
    void verifyOtp(VerifyOtpRequest request);
}
