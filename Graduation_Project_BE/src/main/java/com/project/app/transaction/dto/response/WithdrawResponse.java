package com.project.app.transaction.dto.response;

import com.project.app.transaction.entity.TransactionStatus;
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
public class WithdrawResponse {
    private String transactionCode;
    private TransactionStatus status;
    private BigDecimal amount;
    private LocalDateTime createdAt;
}
