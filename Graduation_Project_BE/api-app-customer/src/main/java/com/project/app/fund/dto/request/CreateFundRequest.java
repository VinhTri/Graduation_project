package com.project.app.fund.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateFundRequest {

    @NotBlank
    @Size(min = 2, max = 50)
    private String name;

    @NotNull
    @DecimalMin(value = "10000")
    private BigDecimal targetAmount;

    @DecimalMin(value = "2000")
    private BigDecimal minDepositAmount;

    @Min(0)
    @Max(5)
    private int coverColorSeed;
}
