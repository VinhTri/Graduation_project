package com.project.app.transaction.service.impl;

import com.project.app.transaction.service.PayOsPayoutService;


import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.model.v1.payouts.Payout;
import vn.payos.model.v1.payouts.PayoutRequests;

import java.util.Collections;

@Service
@Slf4j
public class PayOsPayoutServiceImpl implements PayOsPayoutService {

    private final PayOS payOS;

    public PayOsPayoutServiceImpl(
            @Value("${payos.client-id}") String clientId,
            @Value("${payos.api-key}") String apiKey,
            @Value("${payos.checksum-key}") String checksumKey) {
        this.payOS = new PayOS(clientId, apiKey, checksumKey);
    }

    @Override
    public void createPayout(String bankCode, String accountNumber, String accountName, int amount, String description, String reference) {
        try {
            log.info("Sending Payout request to PayOS for Reference: {}", reference);


            
            PayoutRequests request = PayoutRequests.builder()
                    .referenceId(reference)
                    .amount((long) amount)
                    .description(description)
                    .toBin(bankCode)
                    .toAccountNumber(accountNumber)
                    // category phải là null hoặc list rỗng để tránh lỗi chữ ký 
                    // Tuy nhiên, mặc định của builder đã xử lý việc này
                    .build();

            Payout response = payOS.payouts().create(request);
            
            log.info("PayOS Payout created successfully: {}", response.getId());

        } catch (Exception e) {
            log.error("PayOS Payout failed: {}", e.getMessage(), e);
            throw new RuntimeException("PayOS error: " + e.getMessage(), e);
        }
    }

    @Override
    public String verifyAndPayout(String bankCode, String accountNumber, int amount, String description, String reference) {
        try {
            log.info("Chi {}đ qua PayOS để xác minh & liên kết STK: {} (ref {})", amount, accountNumber, reference);

            PayoutRequests request = PayoutRequests.builder()
                    .referenceId(reference)
                    .amount((long) amount)
                    .description(description)
                    .toBin(bankCode)
                    .toAccountNumber(accountNumber)
                    .build();

            // Chi thật: tiền 2.000đ được chuyển vào STK khách (đã trừ 2.000đ phí trong ví),
            // đồng thời PayOS trả về tên chủ tài khoản để lưu lại.
            Payout response = payOS.payouts().create(request);

            // Log toàn bộ phản hồi để chẩn đoán (id, trạng thái, transactions).
            log.info("PayOS payout response: {}", response);

            if (response != null && response.getTransactions() != null && !response.getTransactions().isEmpty()) {
                String accountName = response.getTransactions().get(0).getToAccountName();
                log.info("PayOS trả tên chủ tài khoản: {}", accountName);
                return accountName;
            }

            log.warn("PayOS tạo lệnh chi nhưng chưa có toAccountName (payout xử lý bất đồng bộ?). Response: {}", response);
        } catch (Exception e) {
            // Log đầy đủ stacktrace + message thật của PayOS để biết nguyên nhân (số dư payout, quyền, key...).
            log.error("PayOS chi xác minh THẤT BẠI cho STK {} (ref {}): {}", accountNumber, reference, e.getMessage(), e);
        }
        return null;
    }
}
