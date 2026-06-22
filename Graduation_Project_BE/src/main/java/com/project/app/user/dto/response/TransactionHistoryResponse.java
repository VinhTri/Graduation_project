package com.project.app.user.dto.response;

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
public class TransactionHistoryResponse {
    private String transactionCode;
    private String type;
    private String status;
    private BigDecimal amount;
    private String note;
    private LocalDateTime createdAt;
}
