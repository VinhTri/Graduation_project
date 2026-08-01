package com.project.app.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDetailsResponse {
    private UserResponse userInfo;
    /** Số dư ví SmartSpend (MAIN) hiện tại */
    private BigDecimal totalBalance;
    /** Tổng tiền đã nạp thành công (TOP_UP SUCCESS) */
    private BigDecimal totalTopUp;
    /** Tổng tiền đã rút thành công (WITHDRAW SUCCESS) */
    private BigDecimal totalWithdraw;
    private List<TransactionHistoryResponse> recentTransactions;
}
