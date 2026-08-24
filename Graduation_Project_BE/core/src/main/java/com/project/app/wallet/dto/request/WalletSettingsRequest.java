package com.project.app.wallet.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WalletSettingsRequest {

    @NotNull(message = "Trạng thái hạn mức không được để trống")
    private Boolean enabled;

    private BigDecimal transactionLimit;

    private BigDecimal dailyLimit;

    @NotBlank(message = "Mã PIN không được để trống")
    @Pattern(regexp = "^\\d{6}$", message = "Mã PIN phải gồm đúng 6 chữ số")
    private String currentPinCode;
}
