package com.project.app.transaction.service.impl;

import com.project.app.transaction.service.SePayService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class SePayServiceImpl implements SePayService {

    @Value("${sepay.account-no:77180227052005}")
    private String accountNo;

    @Value("${sepay.bank-id:MB}")
    private String bankId;

    @Value("${sepay.account-name:TRAN%20VINH%20TRI}")
    private String accountName;

    /**
     * Generate VietQR URL for top-up transactions.
     * When the user scans this QR and transfers money, SePay will detect the transaction
     * based on the addInfo (transactionCode) and trigger a webhook.
     */
    @Override
    public String generateVietQrUrl(BigDecimal amount, String transactionCode) {
        return String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                bankId, accountNo, amount.toPlainString(), transactionCode, accountName);
    }
}
