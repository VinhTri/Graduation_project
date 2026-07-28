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
    private BigDecimal totalBalance;
    private List<TransactionHistoryResponse> recentTransactions;
}
