package com.project.app.auth.service.impl;

import com.project.app.auth.dto.request.ChangePasswordRequest;
import com.project.app.auth.dto.request.ChangePinRequest;
import com.project.app.auth.dto.request.LoginRequest;
import com.project.app.auth.dto.request.RegisterRequest;
import com.project.app.auth.dto.request.ResetPasswordRequest;
import com.project.app.auth.dto.request.SendOtpRequest;
import com.project.app.auth.dto.request.VerifyOtpRequest;
import com.project.app.auth.dto.request.UnlockAccountRequest;
import com.project.app.auth.dto.response.AuthResponse;
import com.project.app.auth.security.CustomUserDetails;
import com.project.app.auth.security.JwtUtil;
import com.project.app.auth.service.AuthService;
import com.project.app.auth.service.AccountSecurityService;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.common.util.GmailDisplayName;
import com.project.app.otp.entity.OtpToken;
import com.project.app.otp.enums.OtpPurpose;
import com.project.app.otp.service.OtpService;
import com.project.app.user.entity.Role;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.notebook.entity.NotebookBook;
import com.project.app.notebook.enums.NotebookBookType;
import com.project.app.notebook.repository.NotebookBookRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.enums.WalletType;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.util.WalletAccountNumberGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Triển khai {@link AuthService}.
 * Tên hiển thị luôn lấy từ phần trước {@code @} của email (không nhập tay).
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final OtpService otpService;
    private final WalletRepository walletRepository;
    private final NotebookBookRepository notebookBookRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountSecurityService accountSecurityService;

    // ====================== ĐĂNG NHẬP / ĐĂNG KÝ ======================

    /** {@inheritDoc} */
    @Override
    public AuthResponse loginUser(LoginRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();
        User user = userRepository.searchByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            if (user.isSecurityLocked()) {
                throw new AppException(ErrorCode.ACCOUNT_SECURITY_LOCKED);
            }
            boolean locked = accountSecurityService.recordPasswordFailure(user.getId());
            throw new AppException(locked ? ErrorCode.ACCOUNT_SECURITY_LOCKED : ErrorCode.INVALID_CREDENTIALS);
        }
        // Đăng nhập đúng vẫn được cấp phiên khi tài khoản đang khóa để người dùng
        // vào Trang chủ và thực hiện luồng OTP. Chỉ OTP mới được phép mở khóa.
        if (!user.isSecurityLocked()) {
            accountSecurityService.resetPasswordFailures(user.getId());
        }
        SecurityContextHolder.getContext().setAuthentication(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return toAuthResponse(userDetails.getUser(), jwtUtil.generateToken(userDetails));
    }

    @Override
    @Transactional
    public void sendUnlockOtp(SendOtpRequest request) {
        User user = requireUserByEmail(request.getEmail());
        if (!user.isSecurityLocked()) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_SECURITY_LOCKED);
        }
        otpService.generateAndSendOtp(
                user.getEmail(), OtpPurpose.ACCOUNT_UNLOCK,
                "Mã OTP mở khóa tài khoản SmartSpend",
                "Mã OTP mở khóa tài khoản của bạn là: %s\nMã có hiệu lực trong 5 phút."
        );
    }

    @Override
    @Transactional
    public void unlockAccount(UnlockAccountRequest request) {
        User user = requireUserByEmail(request.getEmail());
        if (!user.isSecurityLocked()) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_SECURITY_LOCKED);
        }
        OtpToken token = otpService.verifyOtp(user.getEmail(), request.getOtp(), OtpPurpose.ACCOUNT_UNLOCK);
        otpService.markOtpAsUsed(token);
        accountSecurityService.unlock(user.getId());
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public void sendRegisterOtp(SendOtpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        otpService.generateAndSendOtp(
                request.getEmail(),
                OtpPurpose.REGISTER,
                "Mã xác nhận đăng ký tài khoản",
                "Mã OTP đăng ký tài khoản của bạn là: %s\nMã có hiệu lực trong vòng 5 phút."
        );
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public AuthResponse registerUser(RegisterRequest request) {
        String email = request.getEmail().trim();
        String displayName = GmailDisplayName.fromEmail(email);

        if (userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        OtpToken otpToken = otpService.verifyOtp(email, request.getOtp(), OtpPurpose.REGISTER);
        otpService.markOtpAsUsed(otpToken);

        User user = new User(
                displayName,
                email,
                passwordEncoder.encode(request.getPassword()),
                Role.USER,
                true
        );
        userRepository.save(user);
        createDefaultWallets(user);

        String jwt = jwtUtil.generateToken(new CustomUserDetails(user));
        return toAuthResponse(user, jwt);
    }

    // ====================== MẬT KHẨU ======================

    /** {@inheritDoc} */
    @Override
    @Transactional
    public void processForgotPassword(SendOtpRequest request) {
        User user = requireUserByEmail(request.getEmail());
        ensureNotSecurityLocked(user);
        otpService.generateAndSendOtp(
                request.getEmail(),
                OtpPurpose.RESET_PASSWORD,
                "Khôi phục mật khẩu",
                "Mã OTP khôi phục mật khẩu của bạn là: %s\nMã có hiệu lực trong vòng 5 phút."
        );
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public void processResetPassword(ResetPasswordRequest request) {
        ensureNotSecurityLocked(requireUserByEmail(request.getEmail()));
        OtpToken otpToken = otpService.verifyOtp(
                request.getEmail(), request.getOtp(), OtpPurpose.RESET_PASSWORD);

        User user = requireUserByEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        otpService.markOtpAsUsed(otpToken);
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = requireUserById(userId);
        ensureNotSecurityLocked(user);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.SAME_PASSWORD);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /** {@inheritDoc} */
    @Override
    public void verifyCurrentPassword(Long userId, String currentPassword) {
        User user = requireUserById(userId);
        ensureNotSecurityLocked(user);
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    // ====================== PIN ======================

    /** {@inheritDoc} */
    @Override
    public boolean hasPinCode(Long userId) {
        return hasPin(requireUserById(userId));
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public void setupPinCode(Long userId, String pinCode) {
        User user = requireUserById(userId);
        ensureNotSecurityLocked(user);
        if (hasPin(user)) {
            throw new AppException(ErrorCode.PIN_ALREADY_SET);
        }
        user.setPinCode(passwordEncoder.encode(pinCode));
        userRepository.save(user);
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public void sendForgotPinOtp(Long userId) {
        User user = requireUserById(userId);
        ensureNotSecurityLocked(user);
        otpService.generateAndSendOtp(
                user.getEmail(),
                OtpPurpose.RESET_PIN,
                "Khôi phục mã PIN bảo mật",
                "Mã OTP khôi phục mã PIN của bạn là: %s\nMã có hiệu lực trong vòng 5 phút."
        );
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public void resetPinCode(Long userId, String otp, String newPinCode) {
        User user = requireUserById(userId);
        ensureNotSecurityLocked(user);
        OtpToken otpToken = otpService.verifyOtp(user.getEmail(), otp, OtpPurpose.RESET_PIN);

        user.setPinCode(passwordEncoder.encode(newPinCode));
        userRepository.save(user);
        otpService.markOtpAsUsed(otpToken);
    }

    /** {@inheritDoc} */
    @Override
    public boolean verifyPinCode(Long userId, String pinCode) {
        User user = requireUserById(userId);
        ensureNotSecurityLocked(user);
        if (!hasPin(user)) {
            return false;
        }
        if (passwordEncoder.matches(pinCode, user.getPinCode())) {
            accountSecurityService.resetPinFailures(userId);
            return true;
        }
        boolean locked = accountSecurityService.recordPinFailure(userId);
        if (locked) throw new AppException(ErrorCode.ACCOUNT_SECURITY_LOCKED);
        return false;
    }

    /** {@inheritDoc} */
    @Override
    public void verifyCurrentPin(Long userId, String currentPinCode) {
        if (!verifyPinCode(userId, currentPinCode)) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public void changePinCode(Long userId, ChangePinRequest request) {
        User user = requireUserById(userId);
        ensureNotSecurityLocked(user);
        if (!hasPin(user)) {
            throw new AppException(ErrorCode.PIN_NOT_SET);
        }
        if (!verifyPinCode(userId, request.getCurrentPin())) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }
        if (passwordEncoder.matches(request.getNewPinCode(), user.getPinCode())) {
            throw new AppException(ErrorCode.SAME_PIN);
        }

        user.setPinCode(passwordEncoder.encode(request.getNewPinCode()));
        userRepository.save(user);
    }

    // ====================== OTP DÙNG CHUNG ======================

    /** {@inheritDoc} */
    @Override
    public void verifyOtp(VerifyOtpRequest request) {
        OtpPurpose purpose;
        try {
            purpose = OtpPurpose.valueOf(request.getPurpose());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }
        otpService.verifyOtp(request.getEmail(), request.getOtp(), purpose);
    }

    // ====================== helpers ======================

    private User requireUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private User requireUserByEmail(String email) {
        return userRepository.searchByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private static boolean hasPin(User user) {
        return user.getPinCode() != null && !user.getPinCode().isEmpty();
    }

    private static void ensureNotSecurityLocked(User user) {
        if (user.isSecurityLocked()) {
            throw new AppException(ErrorCode.ACCOUNT_SECURITY_LOCKED);
        }
    }

    private void createDefaultWallets(User user) {
        Wallet main = new Wallet(
                user, "Ví SmartSpend", BigDecimal.ZERO, true, false, WalletType.MAIN);
        main.setAccountNumber(WalletAccountNumberGenerator.generateUnique(walletRepository));
        walletRepository.save(main);

        notebookBookRepository.save(NotebookBook.builder()
                .user(user)
                .name(NotebookBook.CASH_BOOK_NAME)
                .balance(BigDecimal.ZERO)
                .bookType(NotebookBookType.CASH)
                .build());
    }

    private static AuthResponse toAuthResponse(User user, String jwt) {
        return AuthResponse.builder()
                .token(jwt)
                .type("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .moneySuffix(user.resolvedMoneySuffix())
                .moneySeparator(user.resolvedMoneySeparator())
                .themeMode(user.resolvedThemeMode())
                .language(user.resolvedLanguage())
                .securityLocked(user.isSecurityLocked())
                .build();
    }
}
