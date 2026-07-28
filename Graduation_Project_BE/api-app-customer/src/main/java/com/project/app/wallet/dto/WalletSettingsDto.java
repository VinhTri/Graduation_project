package com.project.app.wallet.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletSettingsDto {
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    @JsonProperty("isLimitEnabled")
    private boolean isLimitEnabled;

    private BigDecimal transactionLimit;
    private BigDecimal dailyLimit;
    private String pinCode;

    @JsonProperty("isLimitEnabled")
    public boolean isLimitEnabled() {
        return isLimitEnabled;
    }

    @JsonProperty("isLimitEnabled")
    public void setIsLimitEnabled(boolean isLimitEnabled) {
        this.isLimitEnabled = isLimitEnabled;
    }
}
