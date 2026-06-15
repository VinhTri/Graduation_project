package com.project.app.transaction.service.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.transaction.dto.request.SePayWebhookRequest;
import com.project.app.transaction.dto.request.TopUpRequest;
import com.project.app.transaction.dto.response.TopUpResponse;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.entity.TransactionStatus;
import com.project.app.transaction.entity.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.transaction.service.TransactionService;
import com.project.app.user.entity.User;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final WalletService walletService;

    public TransactionServiceImpl(TransactionRepository transactionRepository, WalletService walletService) {
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
    }

    @Override
    @Transactional
    public TopUpResponse initiateTopUp(User user, TopUpRequest request) {
        Wallet wallet;
        if (request.getWalletId() != null) {
            wallet = walletService.getWalletById(request.getWalletId(), user.getId());
        } else {
            wallet = walletService.getDefaultWallet(user.getId());
        }

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setWallet(wallet);
        transaction.setAmount(request.getAmount());
        transaction.setType(TransactionType.TOP_UP);
        transaction.setStatus(TransactionStatus.PENDING);
        
        // Generate a unique transaction code
        String transactionCode = "TX" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        transaction.setTransactionCode(transactionCode);
        
        transaction.setNote(request.getNote());
        transaction.setCategoryId(request.getCategoryId());

        transaction = transactionRepository.save(transaction);

        // Generate VietQR URL for MBBank
        String accountNo = "77180227052005";
        String bankId = "MB";
        String accountName = "TRAN%20VINH%20TRI";
        String qrUrl = String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                bankId, accountNo, transaction.getAmount().toPlainString(), transactionCode, accountName);
        
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);

        return new TopUpResponse(
                transactionCode,
                qrUrl,
                expiresAt,
                transaction.getAmount(),
                transaction.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public void processSePayWebhook(SePayWebhookRequest request) {
        String content = request.getContent();
        if (content == null || content.isEmpty()) {
            return;
        }

        // Extract transaction code starting with TX from content
        String transactionCode = null;
        String[] words = content.split("[\\s_\\-]+"); // split by space, underscore or dash
        for (String word : words) {
            if (word.toUpperCase().startsWith("TX")) {
                transactionCode = word.toUpperCase();
                break;
            }
        }

        if (transactionCode == null) {
            return;
        }

        Transaction transaction = transactionRepository.findByTransactionCode(transactionCode)
                .orElse(null);

        if (transaction == null || transaction.getStatus() != TransactionStatus.PENDING || transaction.getType() != TransactionType.TOP_UP) {
            return; // Ignore if not found or not pending
        }

        // Verify amount
        if (request.getTransferAmount() != null && request.getTransferAmount().compareTo(transaction.getAmount()) >= 0) {
            // Success
            transaction.setStatus(TransactionStatus.SUCCESS);
            transactionRepository.save(transaction);

            // Add balance
            walletService.addBalance(transaction.getWallet().getId(), transaction.getAmount());
        }
    }

    @Override
    public Transaction getTransactionByCode(String transactionCode, User user) {
        Transaction transaction = transactionRepository.findByTransactionCode(transactionCode)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TRANSACTION));
        
        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        
        return transaction;
    }
}
