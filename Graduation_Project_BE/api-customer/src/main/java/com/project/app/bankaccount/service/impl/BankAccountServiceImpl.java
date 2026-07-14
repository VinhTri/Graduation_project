package com.project.app.bankaccount.service.impl;

import com.project.app.bankaccount.service.BankAccountService;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.bankaccount.dto.request.BankAccountRequest;
import com.project.app.bankaccount.dto.response.BankAccountResponse;
import com.project.app.bankaccount.entity.BankAccount;
import com.project.app.user.entity.User;
import com.project.app.bankaccount.repository.BankAccountRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.transaction.service.PayOsPayoutService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankAccountServiceImpl implements BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final PayOsPayoutService payOsPayoutService;

    // ====================== LẤY DANH S�?CH ======================
    @Transactional(readOnly = true)
    public List<BankAccountResponse> getBankAccounts(User user) {
        return bankAccountRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ====================== THÊM MỚI ======================
    @Transactional
    public BankAccountResponse addBankAccount(User user, BankAccountRequest request) {
        if (bankAccountRepository.existsByAccountNumberAndUserId(request.getAccountNumber(), user.getId())) {
            throw new AppException(ErrorCode.BANK_ACCOUNT_ALREADY_EXISTS);
        }

        Wallet wallet = walletRepository.findByUserIdAndIsDefaultTrue(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        BigDecimal fee = new BigDecimal("2000");

        if (wallet.getBalance().compareTo(fee) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        // Trừ ti�?n trong ví
        wallet.setBalance(wallet.getBalance().subtract(fee));
        walletRepository.save(wallet);

        // Lưu lịch sử giao dịch trừ ti�?n
        String transactionCode = "FEE" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setWallet(wallet);
        transaction.setAmount(fee);
        transaction.setType(TransactionType.BANK_LINK_FEE);
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setTransactionCode(transactionCode);
        transaction.setNote("Phí xác minh liên kết tài khoản ngân hàng");
        transactionRepository.save(transaction);

        // G�?i PayOS để lấy tên bằng cách chuyển khoản mồi 2.000 VN�?
        String accountName = payOsPayoutService.lookupAccountName(request.getBankCode(), request.getAccountNumber());
        
        if (accountName == null) {
            throw new AppException(ErrorCode.BANK_VERIFICATION_FAILED);
        }

        boolean isFirstAccount = bankAccountRepository.findByUserId(user.getId()).isEmpty();

        BankAccount bankAccount = BankAccount.builder()
                .user(user)
                .bankCode(request.getBankCode())
                .bankName(request.getBankName())
                .accountNumber(request.getAccountNumber())
                .accountName(accountName)
                .isDefault(isFirstAccount) // Nếu là tài khoản đầu tiên, tự động đặt làm mặc định
                .build();

        BankAccount savedAccount = bankAccountRepository.save(bankAccount);
        return mapToResponse(savedAccount);
    }

    // ====================== XÓA TÀI KHOẢN ======================
    @Transactional
    public void deleteBankAccount(User user, Long accountId) {
        BankAccount bankAccount = bankAccountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND));

        bankAccountRepository.delete(bankAccount);

        // Nếu tài khoản bị xóa là mặc định, chuyển trạng thái mặc định sang tài khoản đầu tiên còn lại (nếu có)
        if (bankAccount.isDefault()) {
            List<BankAccount> remainingAccounts = bankAccountRepository.findByUserId(user.getId());
            if (!remainingAccounts.isEmpty()) {
                BankAccount newDefault = remainingAccounts.get(0);
                newDefault.setDefault(true);
                bankAccountRepository.save(newDefault);
            }
        }
    }

    // ====================== MAPPER ======================
    private BankAccountResponse mapToResponse(BankAccount account) {
        return BankAccountResponse.builder()
                .id(account.getId())
                .bankCode(account.getBankCode())
                .bankName(account.getBankName())
                .accountNumber(account.getAccountNumber())
                .accountName(account.getAccountName())
                .isDefault(account.isDefault())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
