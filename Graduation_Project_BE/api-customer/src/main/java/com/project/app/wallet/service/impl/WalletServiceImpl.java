package com.project.app.wallet.service.impl;

import com.project.app.auth.service.AuthService;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final AuthService authService;

    public WalletServiceImpl(WalletRepository walletRepository, AuthService authService) {
        this.walletRepository = walletRepository;
        this.authService = authService;
    }

    // ====================== LẤY VÍ MẶC ĐỊNH ======================
    @Override
    public Wallet getDefaultWallet(Long userId) {
        return walletRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
    }

    // ====================== LẤY VÍ THEO ID ======================
    @Override
    public Wallet getWalletById(Long walletId, Long userId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        
        if (!wallet.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        return wallet;
    }

    // ====================== CẬP NHẬT SỐ DƯ ======================
    @Override
    @Transactional
    public void addBalance(Long walletId, BigDecimal amount) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
    }

    // ====================== CẬP NHẬT THIẾT LẬP VÍ ======================
    @Override
    @Transactional
    public void updateWalletSettings(Long walletId, Long userId, com.project.app.wallet.dto.WalletSettingsDto request) {
        if (request.getPinCode() == null || request.getPinCode().isBlank()) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }
        if (!authService.verifyPinCode(userId, request.getPinCode())) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        Wallet wallet = getWalletById(walletId, userId);
        
        wallet.setLimitEnabled(request.isLimitEnabled());
        if (request.isLimitEnabled()) {
            wallet.setTransactionLimit(request.getTransactionLimit());
            wallet.setDailyLimit(request.getDailyLimit());
        } else {
            // Optional: reset limits if disabled, or keep them for later when re-enabled
            wallet.setTransactionLimit(request.getTransactionLimit());
            wallet.setDailyLimit(request.getDailyLimit());
        }
        
        walletRepository.save(wallet);
    }

    // ====================== THIẾT LẬP SỐ TÀI KHOẢN ======================
    @Override
    @Transactional
    public Wallet setupAccount(com.project.app.user.entity.User user, com.project.app.wallet.dto.request.SetupAccountRequest request) {
        Wallet wallet = getDefaultWallet(user.getId());

        if (wallet.getAccountNumber() != null && !wallet.getAccountNumber().isEmpty()) {
            throw new AppException(ErrorCode.ACCOUNT_ALREADY_SETUP);
        }

        if (walletRepository.existsByAccountNumber(request.getAccountNumber())) {
            throw new AppException(ErrorCode.ACCOUNT_NUMBER_ALREADY_EXISTS);
        }

        wallet.setAccountNumber(request.getAccountNumber());
        return walletRepository.save(wallet);
    }

    @Override
    public String getAccountNumberForUser(Long userId) {
        Wallet wallet = getDefaultWallet(userId);
        String accountNumber = wallet.getAccountNumber();
        return accountNumber != null && !accountNumber.isBlank() ? accountNumber : null;
    }
}
