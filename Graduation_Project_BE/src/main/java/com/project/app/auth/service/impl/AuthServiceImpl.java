package com.project.app.auth.service.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.project.app.auth.dto.request.*;
import com.project.app.auth.dto.response.AuthResponse;
import com.project.app.auth.security.CustomUserDetails;
import com.project.app.auth.security.JwtUtil;
import com.project.app.auth.service.AuthService;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.common.service.EmailService;
import com.project.app.user.entity.OtpPurpose;
import com.project.app.user.entity.OtpToken;
import com.project.app.user.entity.Role;
import com.project.app.user.entity.User;
import com.project.app.user.repository.OtpTokenRepository;
import com.project.app.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Collections;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final GoogleIdTokenVerifier verifier;

    private static final long OTP_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes

    public AuthServiceImpl(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            UserRepository userRepository,
            OtpTokenRepository otpTokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${app.google.client-id:}") String clientId) {

        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.otpTokenRepository = otpTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
    @Override
    @Transactional
    public void sendRegisterOtp(SendOtpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        otpTokenRepository.deleteByEmailAndPurpose(request.getEmail(), OtpPurpose.REGISTER);

        String otp = generateOtp();
        OtpToken otpToken = new OtpToken(
                request.getEmail(),
                otp,
                OtpPurpose.REGISTER,
                new Date(System.currentTimeMillis() + OTP_EXPIRATION_TIME)
        );
        otpTokenRepository.save(otpToken);

        String emailText = "Mã OTP đăng ký tài khoản của bạn là: " + otp + "\nMã có hiệu lực trong vòng 5 phút.";
        emailService.sendEmail(request.getEmail(), "Mã xác nhận đăng ký tài khoản", emailText);
    }

    @Override
    @Transactional
    public AuthResponse registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        OtpToken otpToken = otpTokenRepository.findByEmailAndOtpAndPurposeAndUsedFalse(
                        request.getEmail(), request.getOtp(), OtpPurpose.REGISTER)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OTP));

        if (otpToken.isExpired()) {
            throw new AppException(ErrorCode.EXPIRED_OTP);
        }

        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                Role.USER,
                true
        );
        userRepository.save(user);

        String jwt = jwtUtil.generateToken(new CustomUserDetails(user));

        return AuthResponse.builder()
                .token(jwt)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .type("Bearer")
                .build();
    }
}