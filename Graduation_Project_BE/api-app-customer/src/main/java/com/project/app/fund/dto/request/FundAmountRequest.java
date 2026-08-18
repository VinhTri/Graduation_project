package com.project.app.fund.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class FundAmountRequest {

    @NotNull
    @DecimalMin(value = "2000")
    private BigDecimal amount;

    @Size(max = 100)
    private String note;

    @NotBlank
    @Size(min = 6, max = 6)
    private String pinCode;
}
