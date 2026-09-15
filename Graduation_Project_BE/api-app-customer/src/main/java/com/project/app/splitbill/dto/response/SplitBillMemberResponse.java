package com.project.app.splitbill.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SplitBillMemberResponse {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private String accountNumber;
    private String avatarUrl;
    private BigDecimal amount;
    private String status;
    private LocalDateTime paidAt;
    private String transactionCode;
    private LocalDateTime lastRemindedAt;
    private LocalDateTime createdAt;
}
