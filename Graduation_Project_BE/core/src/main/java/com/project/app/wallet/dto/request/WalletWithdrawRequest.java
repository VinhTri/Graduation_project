package com.project.app.wallet.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WalletWithdrawRequest {

    @NotNull(message = "Số tiền là bắt buộc")
    @DecimalMin(value = "2000", message = "Số tiền rút tối thiểu là 2.000đ")
    @DecimalMax(value = "100000000000", message = "Số tiền tối đa mỗi lần rút là 100 tỷ")
    private BigDecimal amount;

    @NotNull(message = "Tài khoản ngân hàng là bắt buộc")
    private Long bankAccountId;

    @NotBlank(message = "Mã PIN là bắt buộc")
    @Size(min = 6, max = 6, message = "Mã PIN phải gồm 6 chữ số")
    private String pinCode;

    @Size(max = 100, message = "Ghi chú tối đa 100 ký tự")
    private String note;
}
