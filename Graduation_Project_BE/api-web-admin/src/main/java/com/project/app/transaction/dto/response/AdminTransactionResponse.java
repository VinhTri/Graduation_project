package com.project.app.transaction.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminTransactionResponse {
    private Long id;
    private String transactionCode;
    private String type;
    private String status;
    private BigDecimal amount;
    private String note;
    private Long categoryId;
    private Long userId;
    private String username;
    private String email;
    private Long walletId;
    private String walletType;
    private LocalDateTime createdAt;
}
