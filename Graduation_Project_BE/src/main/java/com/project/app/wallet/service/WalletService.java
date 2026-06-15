package com.project.app.wallet.service;

import com.project.app.wallet.entity.Wallet;
import java.math.BigDecimal;

public interface WalletService {
    Wallet getDefaultWallet(Long userId);
    Wallet getWalletById(Long walletId, Long userId);
    void addBalance(Long walletId, BigDecimal amount);
}
