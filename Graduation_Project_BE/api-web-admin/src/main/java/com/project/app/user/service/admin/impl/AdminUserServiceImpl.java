package com.project.app.user.service.admin.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.dto.response.TransactionHistoryResponse;
import com.project.app.user.dto.response.UserDetailsResponse;
import com.project.app.user.dto.response.UserResponse;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.user.service.admin.AdminUserService;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.enums.WalletType;
import com.project.app.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .isActive(user.isActive())
                        .createdAt(user.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public void toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setActive(!user.isActive());
        userRepository.save(user);
    }

    @Override
    public UserDetailsResponse getUserDetailsForAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        UserResponse userInfo = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();

        List<Wallet> wallets = walletRepository.findByUserId(userId);
        BigDecimal totalBalance = wallets.stream()
                .filter(w -> w.getWalletType() == WalletType.MAIN)
                .map(Wallet::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Transaction> moneyFlow = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(tx -> tx.getType() == TransactionType.TOP_UP || tx.getType() == TransactionType.WITHDRAW)
                .collect(Collectors.toList());

        BigDecimal totalTopUp = moneyFlow.stream()
                .filter(tx -> tx.getType() == TransactionType.TOP_UP && tx.getStatus() == TransactionStatus.SUCCESS)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalWithdraw = moneyFlow.stream()
                .filter(tx -> tx.getType() == TransactionType.WITHDRAW && tx.getStatus() == TransactionStatus.SUCCESS)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<TransactionHistoryResponse> recentTransactions = moneyFlow.stream()
                .limit(20)
                .map(tx -> TransactionHistoryResponse.builder()
                        .transactionCode(tx.getTransactionCode())
                        .type(tx.getType().name())
                        .status(tx.getStatus().name())
                        .amount(tx.getAmount())
                        .note(tx.getNote())
                        .createdAt(tx.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return UserDetailsResponse.builder()
                .userInfo(userInfo)
                .totalBalance(totalBalance)
                .totalTopUp(totalTopUp)
                .totalWithdraw(totalWithdraw)
                .recentTransactions(recentTransactions)
                .build();
    }
}
