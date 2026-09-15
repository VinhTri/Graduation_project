package com.project.app.transaction.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransferRequest {

    @NotBlank(message = "Số tài khoản người nhận không được để trống")
    private String receiverAccountNumber;

    @NotNull(message = "Số tiền không được để trống")
    @Min(value = 1000, message = "Số tiền chuyển tối thiểu là 1.000đ")
    private BigDecimal amount;

    @NotBlank(message = "Mã PIN không được để trống")
    private String pinCode;

    private String note;
}
