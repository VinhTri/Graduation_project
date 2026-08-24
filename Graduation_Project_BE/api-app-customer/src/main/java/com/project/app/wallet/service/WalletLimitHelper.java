package com.project.app.wallet.service;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.enums.WalletTransactionType;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.repository.WalletTransactionRepository;
import com.project.app.wallet.support.WalletLimitWindows;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WalletLimitHelper {

    private final WalletTransactionRepository walletTransactionRepository;
    private final WalletRepository walletRepository;

    public BigDecimal dailyUsedAmount(Long userId, Wallet wallet) {
        if (!wallet.isLimitEnabled()) {
            return BigDecimal.ZERO;
        }

        ensureLimitActivatedAt(wallet);
        LocalDateTime from = WalletLimitWindows.dailyWindowStart(wallet);
        LocalDateTime to = WalletLimitWindows.endOfToday();

        // Chuyển tiền nội bộ / chia tiền cũng ghi wallet_transactions WITHDRAW,
        // nên không cộng thêm Transaction.TRANSFER để tránh đếm trùng.
        BigDecimal withdrawn = walletTransactionRepository.sumAmountByUserAndTypeAndCreatedAtRange(
                userId,
                WalletTransactionType.WITHDRAW,
                from,
                to
        );
        return withdrawn != null ? withdrawn : BigDecimal.ZERO;
    }

    public void enforceOutgoingLimits(Long userId, Wallet wallet, BigDecimal amount) {
        if (!wallet.isLimitEnabled()) {
            return;
        }

        if (wallet.getTransactionLimit() != null
                && amount.compareTo(wallet.getTransactionLimit()) > 0) {
            throw new AppException(ErrorCode.WALLET_TRANSACTION_LIMIT_EXCEEDED);
        }

        if (wallet.getDailyLimit() != null) {
            BigDecimal used = dailyUsedAmount(userId, wallet);
            BigDecimal remaining = wallet.getDailyLimit().subtract(used);
            if (remaining.compareTo(BigDecimal.ZERO) < 0) {
                remaining = BigDecimal.ZERO;
            }
            if (amount.compareTo(remaining) > 0) {
                throw new AppException(ErrorCode.WALLET_DAILY_LIMIT_EXCEEDED);
            }
        }
    }

    private void ensureLimitActivatedAt(Wallet wallet) {
        if (wallet.getLimitActivatedAt() == null) {
            wallet.setLimitActivatedAt(LocalDateTime.now());
            walletRepository.save(wallet);
        }
    }
}
