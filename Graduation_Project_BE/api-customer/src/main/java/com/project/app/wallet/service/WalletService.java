package com.project.app.wallet.service;

import com.project.app.wallet.entity.Wallet;
import java.math.BigDecimal;

public interface WalletService {
    Wallet getDefaultWallet(Long userId);
    Wallet getWalletById(Long walletId, Long userId);
    void addBalance(Long walletId, BigDecimal amount);
    void updateWalletSettings(Long walletId, Long userId, com.project.app.wallet.dto.WalletSettingsDto request);
    Wallet setupAccount(com.project.app.user.entity.User user, com.project.app.wallet.dto.request.SetupAccountRequest request);
    String getAccountNumberForUser(Long userId);
}
