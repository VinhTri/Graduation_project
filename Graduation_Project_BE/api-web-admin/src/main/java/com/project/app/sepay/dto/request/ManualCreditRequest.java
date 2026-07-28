package com.project.app.sepay.dto.request;

import lombok.Data;

@Data
public class ManualCreditRequest {
    /** STK ví nội bộ — nếu bỏ trống sẽ dùng parsedWalletAccount từ log SePay */
    private String walletAccountNumber;
}
