package com.project.app.wallet.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WalletTopUpRequest {

    @NotNull(message = "Số tiền là bắt buộc")
    @DecimalMin(value = "1000", message = "Số tiền nạp tối thiểu là 1.000đ")
    @DecimalMax(value = "100000000000", message = "Số tiền tối đa mỗi lần nạp là 100 tỷ")
    private BigDecimal amount;

    @NotNull(message = "Danh mục là bắt buộc")
    private Long categoryId;

    @Size(max = 100, message = "Ghi chú tối đa 100 ký tự")
    private String note;
}
