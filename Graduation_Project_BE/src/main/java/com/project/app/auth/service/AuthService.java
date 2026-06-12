package com.project.app.auth.service;

import com.project.app.auth.dto.request.RegisterRequest;
import com.project.app.auth.dto.request.SendOtpRequest;
import com.project.app.auth.dto.response.AuthResponse;

public interface AuthService {
    void sendRegisterOtp(SendOtpRequest request);
    AuthResponse registerUser(RegisterRequest request);
}
