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
import com.project.app.otp.entity.OtpPurpose;
import com.project.app.otp.entity.OtpToken;
import com.project.app.user.entity.Role;
import com.project.app.user.entity.User;
import com.project.app.otp.service.OtpService;
import com.project.app.user.repository.UserRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final OtpService otpService;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;
    private final GoogleIdTokenVerifier verifier;

    private static final long OTP_EXPIRATION_TIME = 5 * 60 * 1000; // 5 phút

    public AuthServiceImpl(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            UserRepository userRepository,
            OtpService otpService,
            WalletRepository walletRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.google.client-id:}") String clientId) {

        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.walletRepository = walletRepository;
        this.passwordEncoder = passwordEncoder;
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    // ====================== ĐĂNG KÝ ======================
    @Override
    @Transactional
    public void sendRegisterOtp(SendOtpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        String messageTemplate = "Mã OTP đăng ký tài khoản của bạn là: %s\nMã có hiệu lực trong vòng 5 phút.";
        otpService.generateAndSendOtp(request.getEmail(), OtpPurpose.REGISTER, "Mã xác nhận đăng ký tài khoản", messageTemplate);
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

        OtpToken otpToken = otpService.verifyOtp(request.getEmail(), request.getOtp(), OtpPurpose.REGISTER);
        otpService.markOtpAsUsed(otpToken);

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                Role.USER,
                true
        );
        userRepository.save(user);

        // Tạo ví SmartSpend mặc định cho user
        Wallet defaultWallet = new Wallet(
                user,
                "Ví SmartSpend",
                BigDecimal.ZERO,
                true, // isDefault
                false // isDeletable
        );
        walletRepository.save(defaultWallet);

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

    // ====================== ĐĂNG NHẬP ======================
    @Override
    public AuthResponse loginUser(LoginRequest request) {
        // request.getUsername() thực chất đang chứa email từ Frontend gửi lên
        User user = userRepository.findByEmail(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        String jwt = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(jwt)
                .id(userDetails.getUser().getId())
                .username(userDetails.getUsername())
                .email(userDetails.getUser().getEmail())
                .role(userDetails.getUser().getRole().name())
                .type("Bearer")
                .build();
    }
    // ====================== QUÊN MẬT KHẨU ======================
    @Override
    @Transactional
    public void processForgotPassword(SendOtpRequest request) {
        userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String messageTemplate = "Mã OTP khôi phục mật khẩu của bạn là: %s\nMã có hiệu lực trong vòng 5 phút.";
        otpService.generateAndSendOtp(request.getEmail(), OtpPurpose.RESET_PASSWORD, "Khôi phục mật khẩu", messageTemplate);
    }

    @Override
    @Transactional
    public void processResetPassword(ResetPasswordRequest request) {
        OtpToken otpToken = otpService.verifyOtp(request.getEmail(), request.getOtp(), OtpPurpose.RESET_PASSWORD);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        otpService.markOtpAsUsed(otpToken);
    }

    // ====================== MÃ PIN ======================
    @Override
    public boolean hasPinCode(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return user.getPinCode() != null && !user.getPinCode().isEmpty();
    }

    @Override
    @Transactional
    public void setupPinCode(Long userId, String pinCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        if (user.getPinCode() != null && !user.getPinCode().isEmpty()) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION); // HOẶC PIN_ALREADY_SET
        }
        
        user.setPinCode(passwordEncoder.encode(pinCode));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void sendForgotPinOtp(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String messageTemplate = "Mã OTP khôi phục mã PIN của bạn là: %s\nMã có hiệu lực trong vòng 5 phút.";
        otpService.generateAndSendOtp(user.getEmail(), OtpPurpose.RESET_PIN, "Khôi phục mã PIN bảo mật", messageTemplate);
    }

    @Override
    @Transactional
    public void resetPinCode(Long userId, String otp, String newPinCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        OtpToken otpToken = otpService.verifyOtp(user.getEmail(), otp, OtpPurpose.RESET_PIN);

        user.setPinCode(passwordEncoder.encode(newPinCode));
        userRepository.save(user);

        otpService.markOtpAsUsed(otpToken);
    }

    @Override
    public boolean verifyPinCode(Long userId, String pinCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (user.getPinCode() == null || user.getPinCode().isEmpty()) {
            return false;
        }
        return passwordEncoder.matches(pinCode, user.getPinCode());
    }

    // ====================== DÙNG CHUNG ======================
    @Override
    public void verifyOtp(VerifyOtpRequest request) {
        OtpPurpose otpPurpose;
        try {
            otpPurpose = OtpPurpose.valueOf(request.getPurpose());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        otpService.verifyOtp(request.getEmail(), request.getOtp(), otpPurpose);
    }
}