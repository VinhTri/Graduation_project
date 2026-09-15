package com.project.app.wallet.support;

import com.project.app.wallet.entity.Wallet;

import java.time.LocalDate;
import java.time.LocalDateTime;

public final class WalletLimitWindows {

    private WalletLimitWindows() {
    }

    /**
     * Lấy đầu ngày theo timezone JVM; nếu hạn mức bật và limitActivatedAt muộn hơn đầu ngày thì dùng
     * thời điểm kích hoạt. Không gọi database. Mốc này dùng làm cận dưới bao gồm trong truy vấn hạn
     * mức.
     */
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

    /**
     * Trả đầu ngày kế tiếp theo timezone JVM. Dùng với điều kiện createdAt nhỏ hơn mốc này để tránh
     * tính lặp giao dịch ở ranh giới ngày; không phải 23:59:59.
     */
    public static LocalDateTime endOfToday() {
        return LocalDate.now().plusDays(1).atStartOfDay();
    }
}
