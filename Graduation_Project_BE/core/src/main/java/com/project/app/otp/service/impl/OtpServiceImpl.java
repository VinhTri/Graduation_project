package com.project.app.otp.service.impl;

import com.project.app.otp.service.OtpService;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.common.service.EmailService;
import com.project.app.otp.entity.OtpPurpose;
import com.project.app.otp.entity.OtpToken;
import com.project.app.otp.repository.OtpTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Date;

@Service
public class OtpServiceImpl implements OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final EmailService emailService;

    private static final long OTP_EXPIRATION_TIME = 5 * 60 * 1000; // 5 phút

    public OtpServiceImpl(OtpTokenRepository otpTokenRepository, EmailService emailService) {
        this.otpTokenRepository = otpTokenRepository;
        this.emailService = emailService;
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    @Override
    @Transactional
    public void generateAndSendOtp(String email, OtpPurpose purpose, String subject, String messageTemplate) {
        // Xóa OTP cũ (nếu có)
        otpTokenRepository.deleteByEmailAndPurpose(email, purpose);

        String otp = generateOtp();
        OtpToken otpToken = new OtpToken(
                email,
                otp,
                purpose,
                new Date(System.currentTimeMillis() + OTP_EXPIRATION_TIME)
        );
        otpTokenRepository.save(otpToken);

        // Thay thế placeholder %s bằng mã OTP
        String emailText = String.format(messageTemplate, otp);
        emailService.sendEmail(email, subject, emailText);
    }

    @Override
    public OtpToken verifyOtp(String email, String otp, OtpPurpose purpose) {
        OtpToken otpToken = otpTokenRepository.findByEmailAndOtpAndPurposeAndUsedFalse(email, otp, purpose)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OTP));

        if (otpToken.isExpired()) {
            throw new AppException(ErrorCode.EXPIRED_OTP);
        }

        return otpToken;
    }

    @Override
    @Transactional
    public void markOtpAsUsed(OtpToken otpToken) {
        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);
    }

    @Override
    @Transactional
    public void deleteOtp(String email, OtpPurpose purpose) {
        otpTokenRepository.deleteByEmailAndPurpose(email, purpose);
    }
}
