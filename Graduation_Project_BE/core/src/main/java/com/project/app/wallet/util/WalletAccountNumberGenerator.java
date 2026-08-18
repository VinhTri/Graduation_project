package com.project.app.wallet.util;

import com.project.app.wallet.repository.WalletRepository;

import java.security.SecureRandom;

/**
 * Sinh số tài khoản ví SmartSpend: đúng 12 chữ số, không trùng trong hệ thống.
 */
public final class WalletAccountNumberGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int LENGTH = 12;
    private static final int MAX_ATTEMPTS = 32;

    private WalletAccountNumberGenerator() {}

    public static String generateUnique(WalletRepository walletRepository) {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            String candidate = randomDigits(LENGTH);
            if (!walletRepository.existsByAccountNumber(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Không thể sinh số tài khoản duy nhất sau " + MAX_ATTEMPTS + " lần thử");
    }

    private static String randomDigits(int length) {
        // 12 số: khoảng [10^11, 10^12) → luôn đủ 12 chữ số, không leading zero
        long min = 100_000_000_000L;
        long max = 1_000_000_000_000L;
        long value = min + (long) (RANDOM.nextDouble() * (max - min));
        return Long.toString(value);
    }
}
