package com.project.app.fund.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class FundTransactionResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String avatarUrl;
    private BigDecimal amount;
    private String type;
    private String note;
    private LocalDateTime createdAt;
    /** true nếu người thực hiện giao dịch đã rời quỹ */
    private boolean memberLeft;
}
