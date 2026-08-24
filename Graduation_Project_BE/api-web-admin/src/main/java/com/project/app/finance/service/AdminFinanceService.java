package com.project.app.finance.service;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.entity.WalletTransaction;
import com.project.app.wallet.enums.WalletTransactionType;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminFinanceService {
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> walletDetail(Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        List<WalletTransaction> ledger = walletTransactionRepository.findAll().stream()
                .filter(item -> item.getWallet().getId().equals(walletId))
                .sorted(Comparator.comparing(WalletTransaction::getCreatedAt).reversed())
                .toList();
        List<Transaction> transactions = transactionRepository.findByUserIdAndWalletIdOrderByCreatedAtDesc(
                wallet.getUser().getId(), walletId);

        BigDecimal moneyIn = ledger.stream().filter(item -> item.getType() == WalletTransactionType.TOP_UP)
                .map(WalletTransaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal moneyOut = ledger.stream().filter(item -> item.getType() == WalletTransactionType.WITHDRAW)
                .map(WalletTransaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("wallet", walletRow(wallet));
        response.put("moneyIn", moneyIn);
        response.put("moneyOut", moneyOut);
        response.put("ledger", ledger.stream().map(this::ledgerRow).toList());
        response.put("transactions", transactions.stream().map(this::transactionRow).toList());
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> reconciliation() {
        List<Transaction> transactions = transactionRepository.findAllWithUserAndWalletOrderByCreatedAtDesc();
        List<WalletTransaction> ledger = walletTransactionRepository.findAll();
        List<Wallet> wallets = walletRepository.findAll();

        Map<String, WalletTransaction> ledgerByOwnerAndCode = new HashMap<>();
        for (WalletTransaction item : ledger) {
            ledgerByOwnerAndCode.put(key(item.getUser().getId(), item.getTransactionCode()), item);
        }
        Map<String, Transaction> transactionByOwnerAndCode = new HashMap<>();
        for (Transaction item : transactions) {
            transactionByOwnerAndCode.put(key(item.getUser().getId(), item.getTransactionCode()), item);
        }

        List<Map<String, Object>> issues = new ArrayList<>();
        for (Transaction transaction : transactions) {
            if (transaction.getStatus() != TransactionStatus.SUCCESS) continue;
            WalletTransaction ledgerItem = ledgerByOwnerAndCode.get(key(
                    transaction.getUser().getId(), transaction.getTransactionCode()));
            if (ledgerItem == null) {
                issues.add(issue("TRANSACTION_WITHOUT_LEDGER", "HIGH", transaction.getWallet(),
                        transaction.getTransactionCode(), transaction.getAmount(),
                        "Giao dịch thành công nhưng không có bản ghi WalletTransaction"));
                continue;
            }
            if (transaction.getAmount().compareTo(ledgerItem.getAmount()) != 0) {
                issues.add(issue("AMOUNT_MISMATCH", "HIGH", transaction.getWallet(),
                        transaction.getTransactionCode(), transaction.getAmount().subtract(ledgerItem.getAmount()).abs(),
                        "Số tiền Transaction và WalletTransaction không khớp"));
            }
            WalletTransactionType expected = expectedLedgerType(transaction.getType());
            if (expected != null && ledgerItem.getType() != expected) {
                issues.add(issue("DIRECTION_MISMATCH", "HIGH", transaction.getWallet(),
                        transaction.getTransactionCode(), transaction.getAmount(),
                        "Chiều tiền vào/ra giữa Transaction và WalletTransaction không khớp"));
            }
        }
        for (WalletTransaction ledgerItem : ledger) {
            if (!transactionByOwnerAndCode.containsKey(key(ledgerItem.getUser().getId(), ledgerItem.getTransactionCode()))) {
                issues.add(issue("LEDGER_WITHOUT_TRANSACTION", "MEDIUM", ledgerItem.getWallet(),
                        ledgerItem.getTransactionCode(), ledgerItem.getAmount(),
                        "WalletTransaction không có Transaction tương ứng; cần xác minh nghiệp vụ rút ngân hàng hoặc dữ liệu cũ"));
            }
        }
        for (Wallet wallet : wallets) {
            if (wallet.getBalance() != null && wallet.getBalance().compareTo(BigDecimal.ZERO) < 0) {
                issues.add(issue("NEGATIVE_BALANCE", "CRITICAL", wallet, null, wallet.getBalance().abs(),
                        "Ví có số dư âm"));
            }
        }

        long critical = issues.stream().filter(item -> "CRITICAL".equals(item.get("severity"))).count();
        long high = issues.stream().filter(item -> "HIGH".equals(item.get("severity"))).count();
        long medium = issues.stream().filter(item -> "MEDIUM".equals(item.get("severity"))).count();
        BigDecimal totalWalletBalance = wallets.stream().map(Wallet::getBalance)
                .filter(value -> value != null).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("walletCount", wallets.size());
        result.put("transactionCount", transactions.size());
        result.put("ledgerCount", ledger.size());
        result.put("totalWalletBalance", totalWalletBalance);
        result.put("criticalCount", critical);
        result.put("highCount", high);
        result.put("mediumCount", medium);
        result.put("issues", issues);
        return result;
    }

    private WalletTransactionType expectedLedgerType(TransactionType type) {
        return switch (type) {
            case TOP_UP, RECEIVE_TRANSFER, INCOME -> WalletTransactionType.TOP_UP;
            case WITHDRAW, TRANSFER, PAYMENT, EXPENSE, BANK_LINK_FEE -> WalletTransactionType.WITHDRAW;
        };
    }

    private Map<String, Object> issue(String type, String severity, Wallet wallet, String code,
                                      BigDecimal amount, String description) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("type", type);
        row.put("severity", severity);
        row.put("walletId", wallet != null ? wallet.getId() : null);
        row.put("accountNumber", wallet != null ? wallet.getAccountNumber() : null);
        row.put("username", wallet != null ? wallet.getUser().getUsername() : null);
        row.put("transactionCode", code);
        row.put("amount", amount);
        row.put("description", description);
        return row;
    }

    private Map<String, Object> walletRow(Wallet wallet) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", wallet.getId());
        row.put("name", wallet.getName());
        row.put("accountNumber", wallet.getAccountNumber());
        row.put("balance", wallet.getBalance());
        row.put("type", wallet.getWalletType().name());
        row.put("username", wallet.getUser().getUsername());
        row.put("email", wallet.getUser().getEmail());
        row.put("limitEnabled", wallet.isLimitEnabled());
        row.put("transactionLimit", wallet.getTransactionLimit());
        row.put("dailyLimit", wallet.getDailyLimit());
        row.put("createdAt", wallet.getCreatedAt());
        return row;
    }

    private Map<String, Object> ledgerRow(WalletTransaction item) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", item.getId());
        row.put("transactionCode", item.getTransactionCode());
        row.put("type", item.getType().name());
        row.put("amount", item.getAmount());
        row.put("note", item.getNote());
        row.put("categoryName", item.getCategoryName());
        row.put("bankName", item.getBankName());
        row.put("bankAccountNumber", item.getBankAccountNumber());
        row.put("createdAt", item.getCreatedAt());
        return row;
    }

    private Map<String, Object> transactionRow(Transaction item) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", item.getId());
        row.put("transactionCode", item.getTransactionCode());
        row.put("type", item.getType().name());
        row.put("status", item.getStatus().name());
        row.put("amount", item.getAmount());
        row.put("note", item.getNote());
        row.put("createdAt", item.getCreatedAt());
        return row;
    }

    private String key(Long userId, String transactionCode) {
        return userId + "::" + transactionCode;
    }
}
