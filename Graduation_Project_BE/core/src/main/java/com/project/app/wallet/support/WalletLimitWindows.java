package com.project.app.wallet.support;

import com.project.app.wallet.entity.Wallet;

import java.time.LocalDate;
import java.time.LocalDateTime;

public final class WalletLimitWindows {

    private WalletLimitWindows() {
    }

    public static LocalDateTime dailyWindowStart(Wallet wallet) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        if (wallet == null || !wallet.isLimitEnabled()) {
            return startOfDay;
        }
        LocalDateTime activatedAt = wallet.getLimitActivatedAt();
        if (activatedAt != null && activatedAt.isAfter(startOfDay)) {
            return activatedAt;
        }
        return startOfDay;
    }

    public static LocalDateTime endOfToday() {
        return LocalDate.now().plusDays(1).atStartOfDay();
    }
}
