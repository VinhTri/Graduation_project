package com.project.app.transaction.service.admin.impl;

import com.project.app.transaction.dto.response.AdminTransactionResponse;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.transaction.service.admin.AdminTransactionService;
import com.project.app.user.entity.User;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.enums.WalletType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminTransactionServiceImpl implements AdminTransactionService {

    private final TransactionRepository transactionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AdminTransactionResponse> getAllTransactions() {
        return transactionRepository.findAllWithUserAndWalletOrderByCreatedAtDesc().stream()
                .filter(tx -> tx.getWallet() != null && tx.getWallet().getWalletType() == WalletType.MAIN)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private AdminTransactionResponse toResponse(Transaction tx) {
        User user = tx.getUser();
        Wallet wallet = tx.getWallet();
        return AdminTransactionResponse.builder()
                .id(tx.getId())
                .transactionCode(tx.getTransactionCode())
                .type(tx.getType() != null ? tx.getType().name() : null)
                .status(tx.getStatus() != null ? tx.getStatus().name() : null)
                .amount(tx.getAmount())
                .note(tx.getNote())
                .categoryId(tx.getCategoryId())
                .userId(user != null ? user.getId() : null)
                .username(user != null ? user.getUsername() : null)
                .email(user != null ? user.getEmail() : null)
                .walletId(wallet != null ? wallet.getId() : null)
                .walletType(wallet != null && wallet.getWalletType() != null ? wallet.getWalletType().name() : null)
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
