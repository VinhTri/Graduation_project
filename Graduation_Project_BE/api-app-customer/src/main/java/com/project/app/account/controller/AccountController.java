package com.project.app.account.controller;

import com.project.app.auth.dto.request.AccountChangePasswordRequest;
import com.project.app.auth.dto.request.AccountChangePinRequest;
import com.project.app.auth.dto.request.AccountVerifyPinRequest;
import com.project.app.auth.dto.request.ChangePasswordRequest;
import com.project.app.auth.dto.request.ChangePinRequest;
import com.project.app.auth.dto.request.VerifyPasswordRequest;
import com.project.app.auth.security.CustomUserDetails;
import com.project.app.auth.service.AuthService;
import com.project.app.common.dto.ApiResponse;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/account")
@RequiredArgsConstructor
public class AccountController {

    private final AuthService authService;

    @PostMapping("/verify-password")
    public ResponseEntity<ApiResponse<Void>> verifyPassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody VerifyPasswordRequest request) {
        authService.verifyCurrentPassword(userDetails.getUser().getId(), request.getCurrentPassword());
        return ApiResponse.ok("Mật khẩu hiện tại hợp lệ!");
    }

    @PostMapping("/verify-pin")
    public ResponseEntity<ApiResponse<Void>> verifyPin(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AccountVerifyPinRequest request) {
        authService.verifyCurrentPin(userDetails.getUser().getId(), request.getCurrentPinCode());
        return ApiResponse.ok("Mã PIN hiện tại hợp lệ!");
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AccountChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_MISMATCH);
        }
        ChangePasswordRequest changeRequest = new ChangePasswordRequest();
        changeRequest.setCurrentPassword(request.getCurrentPassword());
        changeRequest.setNewPassword(request.getNewPassword());
        authService.changePassword(userDetails.getUser().getId(), changeRequest);
        return ApiResponse.ok("Mật khẩu đã đổi thành công!");
    }

    @PostMapping("/change-pin")
    public ResponseEntity<ApiResponse<Void>> changePin(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AccountChangePinRequest request) {
        if (!request.getNewPinCode().equals(request.getConfirmPinCode())) {
            throw new AppException(ErrorCode.PIN_MISMATCH);
        }
        ChangePinRequest changeRequest = new ChangePinRequest();
        changeRequest.setCurrentPin(request.getCurrentPinCode());
        changeRequest.setNewPinCode(request.getNewPinCode());
        authService.changePinCode(userDetails.getUser().getId(), changeRequest);
        return ApiResponse.ok("Mã PIN đã thay đổi thành công!");
    }
}
