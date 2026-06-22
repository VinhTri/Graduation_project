package com.project.app.wallet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletSettingsDto {
    @com.fasterxml.jackson.annotation.JsonProperty("isLimitEnabled")
    private boolean isLimitEnabled;
    private BigDecimal transactionLimit;
    private BigDecimal dailyLimit;
}
