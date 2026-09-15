package com.project.app.transaction.service;

import java.math.BigDecimal;

public interface SePayService {
    String generateVietQrUrl(BigDecimal amount, String transactionCode);
}
