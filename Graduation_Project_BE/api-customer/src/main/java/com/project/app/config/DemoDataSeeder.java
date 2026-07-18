package com.project.app.config;

import com.project.app.bankaccount.entity.BankAccount;
import com.project.app.bankaccount.repository.BankAccountRepository;
import com.project.app.user.entity.Role;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.enums.WalletType;
import com.project.app.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Seed 3 tài khoản demo để test báo cáo / danh mục / nạp-rút mock.
 * Chạy idempotent: đã có email thì bỏ qua (hoặc bổ sung ví/STK nếu thiếu).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DemoDataSeeder implements ApplicationRunner {

    private static final String DEMO_PASSWORD = "Tri001@a";
    private static final String DEMO_PIN = "123456";
    private static final BigDecimal STARTER_BALANCE = new BigDecimal("5000000");

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final BankAccountRepository bankAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedDemoUser(1, "tri1", "tri1@gmail.com", "000000000000001");
        seedDemoUser(2, "tri2", "tri2@gmail.com", "000000000000002");
        seedDemoUser(3, "tri3", "tri3@gmail.com", "000000000000003");
        log.info("Demo accounts ready: tri1@gmail.com .. tri3@gmail.com / password Tri001@a / PIN 123456");
    }

    private void seedDemoUser(int index, String username, String email, String accountNumber) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = new User(
                    username,
                    email,
                    passwordEncoder.encode(DEMO_PASSWORD),
                    Role.USER,
                    true
            );
            user.setPinCode(passwordEncoder.encode(DEMO_PIN));
            user = userRepository.save(user);
            log.info("Created demo user {}", email);
        } else {
            // Đồng bộ mật khẩu/PIN demo để luôn đăng nhập được khi test
            user.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
            user.setPinCode(passwordEncoder.encode(DEMO_PIN));
            user = userRepository.save(user);
        }

        final Long userId = user.getId();

        Wallet mainWallet = walletRepository.findByUserIdAndIsDefaultTrue(userId).orElse(null);
        if (mainWallet == null) {
            mainWallet = new Wallet(user, "Ví SmartSpend", STARTER_BALANCE, true, false, WalletType.MAIN);
            mainWallet.setAccountNumber(accountNumber);
            walletRepository.save(mainWallet);
        } else {
            // Gán đúng STK demo nếu chưa bị trùng bởi user khác
            if (!accountNumber.equals(mainWallet.getAccountNumber())) {
                boolean takenByOther = walletRepository.findByAccountNumber(accountNumber)
                        .map(w -> !w.getUser().getId().equals(userId))
                        .orElse(false);
                if (!takenByOther) {
                    mainWallet.setAccountNumber(accountNumber);
                }
            }
            if (mainWallet.getBalance() == null || mainWallet.getBalance().compareTo(BigDecimal.ZERO) == 0) {
                mainWallet.setBalance(STARTER_BALANCE);
            }
            if (mainWallet.getWalletType() == null || mainWallet.getWalletType() != WalletType.MAIN) {
                mainWallet.setWalletType(WalletType.MAIN);
            }
            walletRepository.save(mainWallet);
        }

        Wallet cashWallet = walletRepository.findByUserIdAndWalletType(userId, WalletType.CASH).orElse(null);
        if (cashWallet == null) {
            cashWallet = new Wallet(user, "Tiền mặt", BigDecimal.ZERO, false, false, WalletType.CASH);
            walletRepository.save(cashWallet);
        }

        boolean hasBank = bankAccountRepository.findByUserId(userId).stream().findAny().isPresent();
        if (!hasBank) {
            bankAccountRepository.save(BankAccount.builder()
                    .user(user)
                    .bankCode("970422")
                    .bankName("MBBank")
                    .accountNumber("DEMO" + String.format("%012d", index))
                    .accountName(username.toUpperCase())
                    .isDefault(true)
                    .build());
        }
    }
}
