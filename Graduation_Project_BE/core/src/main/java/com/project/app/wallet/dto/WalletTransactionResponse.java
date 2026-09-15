package com.project.app.wallet.dto;

import com.project.app.wallet.entity.WalletTransaction;
import com.project.app.wallet.enums.WalletTransactionType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class WalletTransactionResponse {

    String transactionCode;
    BigDecimal amount;
    WalletTransactionType type;
    String note;
    Long categoryId;
    String categoryName;
    String categoryIcon;
    String categoryColor;
    String categoryBgColor;
    boolean categoryDeleted;
    Long bankAccountId;
    String bankName;
    String bankAccountNumber;
    String bankCode;
    String bankAccountName;
    BigDecimal balanceAfter;
    LocalDateTime createdAt;

    public static WalletTransactionResponse from(
            WalletTransaction transaction,
            String categoryIcon,
            String categoryColor,
            String categoryBgColor,
            boolean categoryDeleted,
            BigDecimal balanceAfter) {
        return WalletTransactionResponse.builder()
                .transactionCode(transaction.getTransactionCode())
                .amount(transaction.getAmount())
                .type(transaction.getType())
                .note(transaction.getNote())
                .categoryId(transaction.getCategoryId())
                .categoryName(transaction.getCategoryName())
                .categoryIcon(categoryIcon)
                .categoryColor(categoryColor)
                .categoryBgColor(categoryBgColor)
                .categoryDeleted(categoryDeleted)
                .bankAccountId(transaction.getBankAccountId())
                .bankName(transaction.getBankName())
                .bankAccountNumber(transaction.getBankAccountNumber())
                .bankCode(transaction.getBankCode())
                .bankAccountName(transaction.getBankAccountName())
                .balanceAfter(balanceAfter)
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
