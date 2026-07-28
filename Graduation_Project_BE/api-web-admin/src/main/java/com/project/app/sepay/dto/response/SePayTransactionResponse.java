package com.project.app.sepay.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class SePayTransactionResponse {
    private Long id;
    private Long sepayId;
    private String gateway;
    private String transactionDate;
    private String accountNumber;
    private String content;
    private String transferType;
    private BigDecimal transferAmount;
    private String referenceCode;
    private String parsedWalletAccount;
    private String matchStatus;
    private String matchNote;
    private LocalDateTime createdAt;

    private Long internalTransactionId;
    private String internalTransactionCode;
    private BigDecimal internalAmount;
    private String internalStatus;
    private String username;
    private String userEmail;
    private String walletAccountNumber;
}
