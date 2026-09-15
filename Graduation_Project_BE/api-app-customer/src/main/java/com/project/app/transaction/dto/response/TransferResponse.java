package com.project.app.transaction.dto.response;

import com.project.app.transaction.enums.TransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferResponse {
    private String transactionCode;
    private TransactionStatus status;
    private BigDecimal amount;
    private String receiverName;
    private LocalDateTime createdAt;
}
