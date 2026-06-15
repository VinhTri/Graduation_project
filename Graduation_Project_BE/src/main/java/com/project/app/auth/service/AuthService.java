package com.project.app.auth.service;

import com.project.app.auth.dto.request.LoginRequest;
import com.project.app.auth.dto.request.RegisterRequest;
import com.project.app.auth.dto.request.ResetPasswordRequest;
import com.project.app.auth.dto.request.SendOtpRequest;
import com.project.app.auth.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse loginUser(LoginRequest request);
    void sendRegisterOtp(SendOtpRequest request);
    AuthResponse registerUser(RegisterRequest request);
    void processForgotPassword(SendOtpRequest request);
    void processResetPassword(ResetPasswordRequest request);
}
