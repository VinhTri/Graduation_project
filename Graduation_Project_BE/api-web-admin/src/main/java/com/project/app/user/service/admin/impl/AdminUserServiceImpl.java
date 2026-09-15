package com.project.app.user.service.admin.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.user.dto.response.TransactionHistoryResponse;
import com.project.app.user.dto.response.UserDetailsResponse;
import com.project.app.user.dto.response.UserResponse;
import com.project.app.user.entity.User;
import com.project.app.user.entity.Role;
import com.project.app.user.repository.UserRepository;
import com.project.app.user.service.admin.AdminUserService;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.enums.WalletType;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.bankaccount.repository.BankAccountRepository;
import com.project.app.user.dto.response.AdminBankAccountResponse;
import com.project.app.user.dto.response.AdminTransactionPageResponse;
import com.project.app.user.repository.AdminUserTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final BankAccountRepository bankAccountRepository;
    private final AdminUserTransactionRepository adminTransactionRepository;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .avatarUrl(user.getAvatarUrl())
                        .role(user.getRole().name())
                        .isActive(user.isActive())
                        .createdAt(user.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public void updateUserStatus(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (user.getRole() == Role.ADMIN) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        user.setActive(active);
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetailsResponse getUserDetailsForAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        UserResponse userInfo = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();

        List<Wallet> wallets = walletRepository.findByUserId(userId);
        BigDecimal totalBalance = wallets.stream()
                .filter(w -> w.getWalletType() == WalletType.MAIN)
                .map(Wallet::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTopUp = adminTransactionRepository.sumByUserAndTypeAndStatus(userId, TransactionType.TOP_UP, TransactionStatus.SUCCESS);
        BigDecimal totalWithdraw = adminTransactionRepository.sumByUserAndTypeAndStatus(userId, TransactionType.WITHDRAW, TransactionStatus.SUCCESS);
        List<AdminBankAccountResponse> bankAccounts = bankAccountRepository.findByUserId(userId).stream().map(account -> AdminBankAccountResponse.builder()
                .id(account.getId()).bankCode(account.getBankCode()).bankName(account.getBankName())
                .accountNumber(account.getAccountNumber()).accountName(account.getAccountName())
                .isDefault(account.isDefault()).createdAt(account.getCreatedAt()).build()).toList();
        List<TransactionHistoryResponse> recentTransactions = getUserTransactions(userId, 0, 10).getContent();

        return UserDetailsResponse.builder()
                .userInfo(userInfo)
                .totalBalance(totalBalance)
                .totalTopUp(totalTopUp)
                .totalWithdraw(totalWithdraw)
                .bankAccounts(bankAccounts)
                .recentTransactions(recentTransactions)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminTransactionPageResponse getUserTransactions(Long userId, int page, int size) {
        if (!userRepository.existsById(userId)) throw new AppException(ErrorCode.USER_NOT_FOUND);
        int safePage = Math.max(0, page);
        int safeSize = Math.min(50, Math.max(5, size));
        var result = adminTransactionRepository.findByUserIdAndTypeInOrderByCreatedAtDesc(
                userId, List.of(TransactionType.TOP_UP, TransactionType.WITHDRAW), PageRequest.of(safePage, safeSize));
        return AdminTransactionPageResponse.builder().content(result.getContent().stream().map(tx -> TransactionHistoryResponse.builder()
                .transactionCode(tx.getTransactionCode()).type(tx.getType().name()).status(tx.getStatus().name())
                .amount(tx.getAmount()).note(tx.getNote()).categoryId(tx.getCategoryId()).createdAt(tx.getCreatedAt()).build()).toList())
                .page(result.getNumber()).size(result.getSize()).totalElements(result.getTotalElements()).totalPages(result.getTotalPages()).build();
    }
}
