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

    /**
     * Tính tiền ra đã dùng trong cửa sổ hạn mức. Tắt hạn mức trả 0. Nếu thiếu mốc kích hoạt thì khởi
     * tạo/lưu mốc ngay. Cửa sổ từ max(đầu ngày, limitActivatedAt) tới đầu ngày sau (loại trừ). SUM
     * wallet_transactions WITHDRAW theo USER, không lọc walletId hoặc status; không cộng thêm
     * Transaction.TRANSFER để tránh đếm hai lần. Query không loại FDEP/FWD, vì vậy bản ghi quỹ
     * WITHDRAW cũng nằm trong tổng nếu đã được lưu. Caller phải hiểu đúng nguồn này.
     */
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

    /**
     * Không làm gì nếu isLimitEnabled=false. So amount với transactionLimit nếu có; sau đó
     * remaining=max(dailyLimit-used,0), amount lớn hơn remaining thì từ chối. Bằng hạn mức vẫn được
     * phép. Chỉ kiểm tra hạn mức, không trừ tiền, không kiểm tra số dư/PIN và không tự lấy khóa.
     * Caller cần transaction/khóa ví để hai yêu cầu không cùng vượt qua kiểm tra.
     */
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

    /**
     * Khi ví bật hạn mức nhưng chưa có mốc bắt đầu, đặt LocalDateTime.now và save ví. Điều này có thể
     * thay đổi dữ liệu dù được gọi từ tính tổng. Không tạo transaction mới; mốc thời gian theo
     * timezone JVM.
     */
    private void ensureLimitActivatedAt(Wallet wallet) {
        if (wallet.getLimitActivatedAt() == null) {
            wallet.setLimitActivatedAt(LocalDateTime.now());
            walletRepository.save(wallet);
        }
    }
}
