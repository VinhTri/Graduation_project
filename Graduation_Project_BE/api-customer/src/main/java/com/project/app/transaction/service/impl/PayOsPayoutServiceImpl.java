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
    public String lookupAccountName(String bankCode, String accountNumber) {
        try {
            log.info("Sử dụng mẹo tạo lệnh Chi Hộ mồi qua PayOS để lấy tên STK: {}", accountNumber);
            String baitReference = "CHECK_" + System.currentTimeMillis();
            
            PayoutRequests request = PayoutRequests.builder()
                    .referenceId(baitReference)
                    .amount(2000L) // Giới hạn tối thiểu 2.000 VND của hệ thống Napas
                    .description("KIEM TRA TEN")
                    .toBin(bankCode)
                    .toAccountNumber(accountNumber)
                    .build();

            Payout response = payOS.payouts().create(request);
            
            if (response != null && response.getTransactions() != null && !response.getTransactions().isEmpty()) {
                String accountName = response.getTransactions().get(0).getToAccountName();
                log.info("Lấy tên thành công từ PayOS Payout: {}", accountName);
                
                // Mẹo: PayOS Kênh Chi mặc định yêu cầu duyệt thủ công qua OTP/Dashboard
                // Lệnh mồi này sẽ nằm ở trạng thái PENDING và tự hủy, không bị mất tiền!
                return accountName;
            }
        } catch (Exception e) {
            log.warn("Mẹo PayOS lấy tên thất bại (có thể STK sai hoặc số dư < 2000đ): {}", e.getMessage());
        }
        return null;
    }
}
