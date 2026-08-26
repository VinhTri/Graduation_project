package com.project.app.transaction.service.impl;

import com.project.app.transaction.service.PayOsPayoutService;


import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.model.v1.payouts.Payout;
import vn.payos.model.v1.payouts.PayoutRequests;
import vn.payos.model.v1.payouts.GetPayoutListParams;

@Service
@Slf4j
public class PayOsPayoutServiceImpl implements PayOsPayoutService {

    private static final int VERIFICATION_POLL_ATTEMPTS = 20;
    private static final long VERIFICATION_POLL_DELAY_MS = 750L;

    private final PayOS payOS;

    public PayOsPayoutServiceImpl(
            @Value("${payos.client-id}") String clientId,
            @Value("${payos.api-key}") String apiKey,
            @Value("${payos.checksum-key}") String checksumKey) {
        this.payOS = new PayOS(clientId, apiKey, checksumKey);
    }

    @Override
    public void createPayout(String bankCode, String accountNumber, String accountName, long amount,
                             String description, String reference) {
        try {
            log.info("Sending Payout request to PayOS for Reference: {}", reference);


            
            PayoutRequests request = PayoutRequests.builder()
                    .referenceId(reference)
                    .amount(amount)
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
    public String verifyAndPayout(String bankCode, String accountNumber, int amount,
                                  String description, String reference) {
        try {
            log.info("Sending bank verification payout for reference: {}", reference);

            PayoutRequests request = PayoutRequests.builder()
                    .referenceId(reference)
                    .amount((long) amount)
                    .description(description)
                    .toBin(bankCode)
                    .toAccountNumber(accountNumber)
                    .build();

            Payout response = null;
            try {
                response = payOS.payouts().create(request);
            } catch (Exception createError) {
                // PayOS có thể ném lỗi khi lệnh chi thất bại nhưng vẫn lưu lệnh và xác minh
                // được thông tin người nhận. Tiếp tục tra cứu bằng referenceId bên dưới.
                log.warn("Verification payout creation returned an error for reference {}: {}. "
                                + "Continuing destination lookup.",
                        reference, createError.getMessage());
            }

            String verifiedName = extractVerifiedAccountName(response);
            if (verifiedName != null) {
                log.info("Bank destination verified immediately for reference: {}", reference);
                return verifiedName;
            }

            // PayOS có thể trả phản hồi tạo lệnh trước khi thông tin người nhận được cập nhật.
            // Đọc lại lệnh trong vài giây để tránh kết luận sai rằng số tài khoản không tồn tại.
            for (int attempt = 1; attempt <= VERIFICATION_POLL_ATTEMPTS; attempt++) {
                Thread.sleep(VERIFICATION_POLL_DELAY_MS);
                try {
                    Payout refreshed;
                    if (response != null && response.getId() != null && !response.getId().isBlank()) {
                        refreshed = payOS.payouts().get(response.getId());
                    } else {
                        refreshed = findPayoutByReference(reference);
                    }
                    verifiedName = extractVerifiedAccountName(refreshed);
                    if (verifiedName != null) {
                        log.info("Bank destination verified after poll {} for reference: {}",
                                attempt, reference);
                        return verifiedName;
                    }
                } catch (Exception pollError) {
                    log.debug("PayOS verification poll {} not ready for reference {}: {}",
                            attempt, reference, pollError.getMessage());
                }
            }

            log.warn("Verification payout did not return an account name for reference: {}", reference);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Bank verification polling interrupted for reference: {}", reference);
        } catch (Exception e) {
            log.warn("Bank verification payout failed for reference {}: {}", reference, e.getMessage());
        }
        return null;
    }

    private Payout findPayoutByReference(String reference) {
        GetPayoutListParams params = GetPayoutListParams.builder()
                .referenceId(reference)
                .limit(1)
                .offset(0)
                .build();
        var page = payOS.payouts().list(params);
        return page.getItems() == null || page.getItems().isEmpty()
                ? null
                : page.getItems().get(0);
    }

    private String extractVerifiedAccountName(Payout payout) {
        if (payout == null || payout.getTransactions() == null || payout.getTransactions().isEmpty()) {
            return null;
        }
        String accountName = payout.getTransactions().get(0).getToAccountName();
        return accountName == null || accountName.isBlank()
                ? null
                : accountName.trim().toUpperCase();
    }
}
