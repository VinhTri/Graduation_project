package com.project.app.sepay.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class ManualCreditRequest {
    /** STK ví nội bộ — nếu bỏ trống sẽ dùng parsedWalletAccount từ log SePay */
    private String walletAccountNumber;

    @NotBlank(message = "Lý do cộng tiền thủ công không được để trống")
    @Size(min = 10, max = 300, message = "Lý do phải có từ 10 đến 300 ký tự")
    private String reason;
}
