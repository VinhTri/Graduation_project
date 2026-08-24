package com.project.app.wallet.dto;

import com.project.app.wallet.entity.Wallet;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletResponse {

    private Long id;
    private String name;
    private BigDecimal balance;
    private String accountNumber;
    private boolean isDefault;
    private boolean isDeletable;
    private String limitStatus;
    private BigDecimal transactionLimit;
    private BigDecimal dailyLimit;
    private BigDecimal dailyTransactedAmount;

    public static WalletResponse from(Wallet wallet) {
        return from(wallet, BigDecimal.ZERO);
    }

    public static WalletResponse from(Wallet wallet, BigDecimal dailyTransactedAmount) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .name(wallet.getName())
                .balance(wallet.getBalance())
                .accountNumber(wallet.getAccountNumber())
                .isDefault(wallet.isDefault())
                .isDeletable(wallet.isDeletable())
                .limitStatus(wallet.isLimitEnabled() ? "ENABLED" : "DISABLED")
                .transactionLimit(wallet.getTransactionLimit())
                .dailyLimit(wallet.getDailyLimit())
                .dailyTransactedAmount(dailyTransactedAmount == null ? BigDecimal.ZERO : dailyTransactedAmount)
                .build();
    }
}
