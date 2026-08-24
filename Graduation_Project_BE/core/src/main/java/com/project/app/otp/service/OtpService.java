package com.project.app.otp.service;

import com.project.app.otp.enums.OtpPurpose;
import com.project.app.otp.entity.OtpToken;

public interface OtpService {
    void generateAndSendOtp(String email, OtpPurpose purpose, String subject, String messageTemplate);
    OtpToken verifyOtp(String email, String otp, OtpPurpose purpose);
    void markOtpAsUsed(OtpToken otpToken);
    void deleteOtp(String email, OtpPurpose purpose);
}
