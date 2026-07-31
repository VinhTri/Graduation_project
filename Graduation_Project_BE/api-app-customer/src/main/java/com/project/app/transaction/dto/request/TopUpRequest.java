package com.project.app.transaction.dto.request;

import java.math.BigDecimal;

// Nạp bao nhiêu nhận bấy nhiêu: QR tĩnh không gắn số tiền nên amount là tùy chọn.
public record TopUpRequest(
        Long walletId,
        BigDecimal amount,
        String note,
        Long categoryId
) {
}
