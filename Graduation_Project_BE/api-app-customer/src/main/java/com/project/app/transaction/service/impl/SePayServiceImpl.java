package com.project.app.transaction.service.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.transaction.service.SePayService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class SePayServiceImpl implements SePayService {

    @Value("${sepay.account-no:}")
    private String accountNo;

    @Value("${sepay.bank-id:MB}")
    private String bankId;

    @Value("${sepay.account-name:}")
    private String accountName;

    /**
     * Generate VietQR URL for top-up transactions.
     * When the user scans this QR and transfers money, SePay will detect the transaction
     * based on the addInfo (transactionCode) and trigger a webhook.
     *
     * Nạp bao nhiêu nhận bấy nhiêu: nếu amount trống thì tạo QR "mở"
     * (không gắn số tiền), khách tự nhập số tiền trong app ngân hàng.
     */
    @Override
    public String generateVietQrUrl(BigDecimal amount, String transactionCode) {
        if (accountNo == null || accountNo.isBlank() || bankId == null || bankId.isBlank()) {
            throw new AppException(ErrorCode.SEPAY_NOT_CONFIGURED);
        }

        String encodedContent = URLEncoder.encode(transactionCode, StandardCharsets.UTF_8);
        String encodedAccountName = accountName == null || accountName.isBlank()
                ? ""
                : "&accountName=" + URLEncoder.encode(accountName, StandardCharsets.UTF_8);
        boolean hasAmount = amount != null && amount.compareTo(BigDecimal.ZERO) > 0;
        if (hasAmount) {
            return String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s%s",
                    bankId.trim(), accountNo.trim(), amount.toPlainString(), encodedContent, encodedAccountName);
        }
        return String.format("https://img.vietqr.io/image/%s-%s-compact2.png?addInfo=%s%s",
                bankId.trim(), accountNo.trim(), encodedContent, encodedAccountName);
    }
}
