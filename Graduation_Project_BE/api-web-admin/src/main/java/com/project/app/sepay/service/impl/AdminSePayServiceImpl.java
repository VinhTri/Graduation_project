package com.project.app.sepay.service.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.sepay.dto.request.ManualCreditRequest;
import com.project.app.sepay.dto.response.ReconciliationItemResponse;
import com.project.app.sepay.dto.response.ReconciliationReportResponse;
import com.project.app.sepay.dto.response.SePayTransactionResponse;
import com.project.app.sepay.service.AdminSePayService;
import com.project.app.transaction.entity.SePayTransaction;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.SePayMatchStatus;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.SePayTransactionRepository;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminSePayServiceImpl implements AdminSePayService {

    private final SePayTransactionRepository sePayTransactionRepository;
    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<SePayTransactionResponse> getSePayHistory() {
        return sePayTransactionRepository.findAllWithDetailsOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ReconciliationReportResponse runReconciliation(boolean persistUpdates) {
        List<SePayTransaction> sePayRows = sePayTransactionRepository.findAllWithDetailsOrderByCreatedAtDesc();
        List<ReconciliationItemResponse> issues = new ArrayList<>();

        long matched = 0;
        long unmatched = 0;
        long mismatch = 0;
        long ignored = 0;
        BigDecimal unmatchedAmount = BigDecimal.ZERO;
        BigDecimal mismatchDelta = BigDecimal.ZERO;

        Set<Long> linkedInternalIds = new HashSet<>();

        for (SePayTransaction row : sePayRows) {
            SePayMatchStatus evaluated = evaluateRow(row);
            if (persistUpdates && row.getMatchStatus() != evaluated) {
                row.setMatchStatus(evaluated);
                if (evaluated == SePayMatchStatus.AMOUNT_MISMATCH) {
                    row.setMatchNote("Số tiền SePay lệch với Transaction nội bộ");
                } else if (evaluated == SePayMatchStatus.MATCHED && row.getTransaction() != null) {
                    row.setMatchNote("Khớp với Transaction nội bộ");
                }
                sePayTransactionRepository.save(row);
            }

            switch (evaluated) {
                case MATCHED -> matched++;
                case UNMATCHED -> {
                    unmatched++;
                    if (row.getTransferAmount() != null) {
                        unmatchedAmount = unmatchedAmount.add(row.getTransferAmount());
                    }
                    issues.add(issue(
                            "UNMATCHED_SEPAY",
                            "HIGH",
                            row.getMatchNote() != null ? row.getMatchNote()
                                    : "Tiền vào SePay nhưng chưa có Transaction/cộng ví nội bộ",
                            row
                    ));
                }
                case AMOUNT_MISMATCH -> {
                    mismatch++;
                    BigDecimal sepayAmt = nz(row.getTransferAmount());
                    BigDecimal internalAmt = row.getTransaction() != null ? nz(row.getTransaction().getAmount()) : BigDecimal.ZERO;
                    mismatchDelta = mismatchDelta.add(sepayAmt.subtract(internalAmt).abs());
                    issues.add(issue(
                            "AMOUNT_MISMATCH",
                            "HIGH",
                            "Số tiền SePay (" + sepayAmt + ") khác Transaction nội bộ (" + internalAmt + ")",
                            row
                    ));
                }
                case IGNORED -> ignored++;
            }

            if (row.getTransaction() != null) {
                linkedInternalIds.add(row.getTransaction().getId());
            }
        }

        List<Transaction> sepayTopUps = transactionRepository
                .findByTypeAndNoteContainingIgnoreCaseOrderByCreatedAtDesc(TransactionType.TOP_UP, "SePay");
        long orphanInternal = 0;
        for (Transaction tx : sepayTopUps) {
            if (!linkedInternalIds.contains(tx.getId())
                    && sePayTransactionRepository.findByTransaction_Id(tx.getId()).isEmpty()) {
                orphanInternal++;
                issues.add(ReconciliationItemResponse.builder()
                        .issueType("ORPHAN_INTERNAL")
                        .severity("MEDIUM")
                        .description("Transaction nội bộ ghi nhận nạp SePay nhưng không có log SePayTransaction")
                        .internalTransactionId(tx.getId())
                        .internalTransactionCode(tx.getTransactionCode())
                        .internalAmount(tx.getAmount())
                        .username(tx.getUser() != null ? tx.getUser().getUsername() : null)
                        .walletAccountNumber(tx.getWallet() != null ? tx.getWallet().getAccountNumber() : null)
                        .detectedAt(LocalDateTime.now())
                        .build());
            }
        }

        return ReconciliationReportResponse.builder()
                .runAt(LocalDateTime.now())
                .totalSePayRecords(sePayRows.size())
                .matchedCount(matched)
                .unmatchedCount(unmatched)
                .amountMismatchCount(mismatch)
                .ignoredCount(ignored)
                .orphanInternalCount(orphanInternal)
                .unmatchedAmountTotal(unmatchedAmount)
                .mismatchAmountDelta(mismatchDelta)
                .issues(issues)
                .build();
    }

    @Override
    @Transactional
    public SePayTransactionResponse manualCredit(Long sepayRecordId, ManualCreditRequest request) {
        SePayTransaction row = entityManager.find(
                SePayTransaction.class, sepayRecordId, LockModeType.PESSIMISTIC_WRITE);
        if (row == null) throw new AppException(ErrorCode.SEPAY_TRANSACTION_NOT_FOUND);

        if (row.getTransaction() != null || row.getMatchStatus() == SePayMatchStatus.MATCHED) {
            throw new AppException(ErrorCode.SEPAY_ALREADY_MATCHED);
        }

        if (row.getTransferAmount() == null || row.getTransferAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }

        String account = request.getWalletAccountNumber() != null
                && !request.getWalletAccountNumber().isBlank()
                ? request.getWalletAccountNumber().trim().toUpperCase()
                : row.getParsedWalletAccount();

        if (account == null || account.isBlank()) {
            throw new AppException(ErrorCode.ACCOUNT_NUMBER_NOT_FOUND);
        }

        Wallet locatedWallet = walletRepository.findByAccountNumber(account)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        Wallet wallet = entityManager.find(Wallet.class, locatedWallet.getId(), LockModeType.PESSIMISTIC_WRITE);
        if (wallet == null) throw new AppException(ErrorCode.WALLET_NOT_FOUND);

        String transactionCode = "TX" + System.currentTimeMillis()
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        Transaction transaction = new Transaction();
        transaction.setUser(wallet.getUser());
        transaction.setWallet(wallet);
        transaction.setAmount(row.getTransferAmount());
        transaction.setType(TransactionType.TOP_UP);
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setTransactionCode(transactionCode);
        transaction.setNote("Nạp tiền vào ví qua SePay (Admin đối soát thủ công): "
                + request.getReason().trim());
        transactionRepository.save(transaction);

        wallet.addBalance(row.getTransferAmount());
        walletRepository.save(wallet);

        row.setParsedWalletAccount(account);
        row.setTransaction(transaction);
        row.setMatchStatus(SePayMatchStatus.MATCHED);
        row.setMatchNote("Admin cộng thủ công vào ví " + account);
        sePayTransactionRepository.save(row);

        return toResponse(sePayTransactionRepository.findById(row.getId()).orElse(row));
    }

    private SePayMatchStatus evaluateRow(SePayTransaction row) {
        if (row.getMatchStatus() == SePayMatchStatus.IGNORED) {
            return SePayMatchStatus.IGNORED;
        }

        Transaction tx = row.getTransaction();
        if (tx == null) {
            return SePayMatchStatus.UNMATCHED;
        }

        BigDecimal sepayAmt = row.getTransferAmount();
        BigDecimal internalAmt = tx.getAmount();
        if (sepayAmt != null && internalAmt != null && sepayAmt.compareTo(internalAmt) != 0) {
            return SePayMatchStatus.AMOUNT_MISMATCH;
        }

        if (tx.getStatus() != TransactionStatus.SUCCESS) {
            return SePayMatchStatus.UNMATCHED;
        }

        return SePayMatchStatus.MATCHED;
    }

    private ReconciliationItemResponse issue(String type, String severity, String description, SePayTransaction row) {
        Transaction tx = row.getTransaction();
        return ReconciliationItemResponse.builder()
                .issueType(type)
                .severity(severity)
                .description(description)
                .sepayRecordId(row.getId())
                .sepayId(row.getSepayId())
                .sepayAmount(row.getTransferAmount())
                .internalTransactionId(tx != null ? tx.getId() : null)
                .internalTransactionCode(tx != null ? tx.getTransactionCode() : null)
                .internalAmount(tx != null ? tx.getAmount() : null)
                .username(tx != null && tx.getUser() != null ? tx.getUser().getUsername() : null)
                .walletAccountNumber(tx != null && tx.getWallet() != null
                        ? tx.getWallet().getAccountNumber()
                        : row.getParsedWalletAccount())
                .detectedAt(LocalDateTime.now())
                .build();
    }

    private SePayTransactionResponse toResponse(SePayTransaction row) {
        Transaction tx = row.getTransaction();
        SePayMatchStatus status = row.getMatchStatus();
        if (status == null) {
            status = tx != null ? SePayMatchStatus.MATCHED : SePayMatchStatus.UNMATCHED;
        }

        return SePayTransactionResponse.builder()
                .id(row.getId())
                .sepayId(row.getSepayId())
                .gateway(row.getGateway())
                .transactionDate(row.getTransactionDate())
                .accountNumber(row.getAccountNumber())
                .content(row.getContent())
                .transferType(row.getTransferType())
                .transferAmount(row.getTransferAmount())
                .referenceCode(row.getReferenceCode())
                .parsedWalletAccount(row.getParsedWalletAccount())
                .matchStatus(status.name())
                .matchNote(row.getMatchNote())
                .createdAt(row.getCreatedAt())
                .internalTransactionId(tx != null ? tx.getId() : null)
                .internalTransactionCode(tx != null ? tx.getTransactionCode() : null)
                .internalAmount(tx != null ? tx.getAmount() : null)
                .internalStatus(tx != null && tx.getStatus() != null ? tx.getStatus().name() : null)
                .username(tx != null && tx.getUser() != null ? tx.getUser().getUsername() : null)
                .userEmail(tx != null && tx.getUser() != null ? tx.getUser().getEmail() : null)
                .walletAccountNumber(tx != null && tx.getWallet() != null
                        ? tx.getWallet().getAccountNumber()
                        : row.getParsedWalletAccount())
                .build();
    }

    private BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
