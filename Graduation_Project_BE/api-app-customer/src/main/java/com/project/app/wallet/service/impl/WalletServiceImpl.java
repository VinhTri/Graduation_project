package com.project.app.wallet.service.impl;

import com.project.app.auth.service.AuthService;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.enums.WalletType;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.service.WalletService;
import com.project.app.wallet.util.WalletAccountNumberGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final com.project.app.transaction.repository.TransactionRepository transactionRepository;

    public WalletServiceImpl(WalletRepository walletRepository, AuthService authService, UserRepository userRepository, com.project.app.transaction.repository.TransactionRepository transactionRepository) {
        this.walletRepository = walletRepository;
        this.authService = authService;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    // ====================== LẤY VÍ MẶC ĐỊNH ======================
    @Override
    @Transactional
    public Wallet getDefaultWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        if (wallet.getWalletType() == null || wallet.getWalletType() != WalletType.MAIN) {
            wallet.setWalletType(WalletType.MAIN);
            walletRepository.save(wallet);
        }
        return ensureMainAccountNumber(wallet);
    }

    // ====================== LẤY VÍ THEO ID ======================
    @Override
    public Wallet getWalletById(Long walletId, Long userId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        
        if (!wallet.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        if (wallet.getWalletType() == WalletType.CASH) {
            throw new AppException(ErrorCode.WALLET_NOT_FOUND);
        }
        return wallet;
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

    // ====================== SỐ TÀI KHOẢN (hệ thống tự sinh) ======================
    @Override
    @Transactional
    public Wallet setupAccount(com.project.app.user.entity.User user, com.project.app.wallet.dto.request.SetupAccountRequest request) {
        // Deprecated: STK do hệ thống random — bỏ qua input user, đảm bảo ví MAIN đã có STK.
        return ensureMainAccountNumber(getDefaultWallet(user.getId()));
    }

    @Override
    public String getAccountNumberForUser(Long userId) {
        Wallet wallet = getDefaultWallet(userId);
        return wallet.getAccountNumber();
    }

    private Wallet ensureMainAccountNumber(Wallet wallet) {
        if (wallet.getAccountNumber() != null && !wallet.getAccountNumber().isBlank()) {
            return wallet;
        }
        wallet.setAccountNumber(WalletAccountNumberGenerator.generateUnique(walletRepository));
        return walletRepository.save(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<Wallet> getBankWallets(Long userId) {
        return walletRepository.findByUserIdAndWalletTypeIn(
                userId,
                java.util.Arrays.asList(WalletType.LINKED, WalletType.MANUAL)
        );
    }

    @Override
    @Transactional
    public Wallet createManualBankWallet(Long userId, String bankName, String accountNumber) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (accountNumber != null && walletRepository.existsByAccountNumber(accountNumber)) {
            throw new AppException(ErrorCode.ACCOUNT_NUMBER_ALREADY_EXISTS);
        }

        Wallet manualBankWallet = new Wallet(
                user,
                bankName != null ? bankName : "Tài khoản ngân hàng",
                BigDecimal.ZERO,
                false,
                true,
                WalletType.MANUAL
        );
        manualBankWallet.setAccountNumber(accountNumber);
        
        return walletRepository.save(manualBankWallet);
    }
    @Override
    @Transactional
    public void deleteManualBankWallet(Long walletId, Long userId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        if (!wallet.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        if (wallet.getWalletType() != WalletType.MANUAL) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // Xóa tất cả các giao dịch liên quan trước
        transactionRepository.deleteAllByWalletId(walletId);

        walletRepository.delete(wallet);
    }
}
