package com.project.app.transaction.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WithdrawRequest {
    
    @NotNull(message = "Số tiền không được để trống")
    @Min(value = 1000, message = "Số tiền rút tối thiểu là 1,000 VND")
    private BigDecimal amount;

    @NotNull(message = "Tài khoản ngân hàng không được để trống")
    private Long bankAccountId;
}
