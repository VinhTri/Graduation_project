package com.project.app.user.service.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.dto.response.TransactionHistoryResponse;
import com.project.app.user.dto.response.UserDetailsResponse;
import com.project.app.user.dto.response.UserResponse;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.user.service.UserService;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

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
        java.math.BigDecimal totalBalance = wallets.stream()
                .map(Wallet::getBalance)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        List<TransactionHistoryResponse> recentTransactions = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .limit(20) // Lấy 20 giao dịch gần nhất
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
                .recentTransactions(recentTransactions)
                .build();
    }
}
