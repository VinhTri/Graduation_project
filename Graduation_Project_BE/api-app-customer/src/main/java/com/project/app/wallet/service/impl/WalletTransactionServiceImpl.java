package com.project.app.wallet.service.impl;

import com.project.app.auth.service.AuthService;
import com.project.app.bankaccount.entity.BankAccount;
import com.project.app.bankaccount.repository.BankAccountRepository;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.service.CategoryService;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.transaction.service.PayOsPayoutService;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.wallet.dto.WalletTransactionResponse;
import com.project.app.wallet.dto.request.WalletWithdrawRequest;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.entity.WalletTransaction;
import com.project.app.wallet.enums.WalletTransactionType;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.repository.WalletTransactionRepository;
import com.project.app.wallet.service.WalletLimitHelper;
import com.project.app.wallet.service.WalletTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletTransactionServiceImpl implements WalletTransactionService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserRepository userRepository;
    private final CategoryService categoryService;
    private final BankAccountRepository bankAccountRepository;
    private final WalletLimitHelper walletLimitHelper;
    private final AuthService authService;
    private final PayOsPayoutService payOsPayoutService;

    @Override
    @Transactional
    public WalletTransactionResponse withdraw(Long userId, WalletWithdrawRequest request) {
        User user = requireUser(userId);
        Wallet wallet = requireDefaultWallet(userId);
        BankAccount bankAccount = requireOwnedAccount(userId, request.getBankAccountId());

        if (request.getPinCode() == null
                || request.getPinCode().isBlank()
                || !authService.verifyPinCode(userId, request.getPinCode())) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        walletLimitHelper.enforceOutgoingLimits(userId, wallet, request.getAmount());

        String transactionCode = generateCode("WD");
        try {
            payOsPayoutService.createPayout(
                    bankAccount.getBankCode(),
                    bankAccount.getAccountNumber(),
                    bankAccount.getAccountName(),
                    request.getAmount().longValueExact(),
                    "Rut tien SmartSpend",
                    transactionCode
            );
        } catch (Exception payoutError) {
            throw new AppException(ErrorCode.WITHDRAW_FAILED);
        }

        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        walletRepository.save(wallet);

        WalletTransaction transaction = WalletTransaction.builder()
                .user(user)
                .wallet(wallet)
                .amount(request.getAmount())
                .type(WalletTransactionType.WITHDRAW)
                .note(normalizeNote(request.getNote()))
                .categoryId(null)
                .categoryName(null)
                .transactionCode(transactionCode)
                .bankAccountId(bankAccount.getId())
                .bankName(bankAccount.getBankName())
                .bankAccountNumber(bankAccount.getAccountNumber())
                .bankCode(bankAccount.getBankCode())
                .bankAccountName(bankAccount.getAccountName())
                .build();

        walletTransactionRepository.save(transaction);
        return toResponse(transaction, null, wallet.getBalance());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> getHistory(Long userId) {
        List<WalletTransaction> transactions =
                walletTransactionRepository.findAllByUser_IdOrderByCreatedAtDesc(userId);

        Set<Long> categoryIds = transactions.stream()
                .map(WalletTransaction::getCategoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, CategoryItem> categories =
                categoryService.findItemsByIdsIncludingDeleted(categoryIds);

        Wallet wallet = walletRepository.findByUserIdAndIsDefaultTrue(userId).orElse(null);
        BigDecimal balance = wallet != null ? wallet.getBalance() : BigDecimal.ZERO;

        return transactions.stream()
                .map(tx -> {
                    Long categoryId = tx.getCategoryId();
                    CategoryItem category = categoryId == null ? null : categories.get(categoryId);
                    return toResponse(tx, category, balance);
                })
                .toList();
    }

    private BankAccount requireOwnedAccount(Long userId, Long accountId) {
        return bankAccountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND));
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private Wallet requireDefaultWallet(Long userId) {
        return walletRepository.findDefaultWalletForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
    }

    private String normalizeNote(String note) {
        if (note == null || note.isBlank()) {
            return null;
        }
        return note.trim();
    }

    private String generateCode(String prefix) {
        return prefix + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    private WalletTransactionResponse toResponse(
            WalletTransaction transaction,
            CategoryItem category,
            BigDecimal balanceAfter) {
        boolean systemCategory = isSystemFundCategory(category, transaction.getCategoryName());
        boolean deleted = transaction.getCategoryId() != null
                && !systemCategory
                && (category == null || category.isDeleted());
        return WalletTransactionResponse.from(
                transaction,
                category != null ? category.getIcon() : null,
                category != null ? category.getColor() : null,
                category != null ? category.getBgColor() : null,
                deleted,
                balanceAfter
        );
    }

    private boolean isSystemFundCategory(CategoryItem category, String categoryName) {
        if (category != null && category.getUser() == null) {
            return true;
        }
        String label = category != null ? category.getLabel() : categoryName;
        if (label == null) {
            return false;
        }
        String cleaned = label.replaceAll("(?i)\\s*\\(đã xóa\\)\\s*$", "").trim();
        return "Nạp quỹ".equals(cleaned)
                || "Rút quỹ".equals(cleaned)
                || "Chia tiền".equals(cleaned)
                || "Chuyển tiền".equals(cleaned)
                || "Nhận chuyển tiền".equals(cleaned);
    }
}
