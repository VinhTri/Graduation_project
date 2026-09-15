package com.project.app.sepay.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ReconciliationItemResponse {
    private String issueType;
    private String severity;
    private String description;
    private Long sepayRecordId;
    private Long sepayId;
    private BigDecimal sepayAmount;
    private Long internalTransactionId;
    private String internalTransactionCode;
    private BigDecimal internalAmount;
    private String username;
    private String walletAccountNumber;
    private LocalDateTime detectedAt;
}
