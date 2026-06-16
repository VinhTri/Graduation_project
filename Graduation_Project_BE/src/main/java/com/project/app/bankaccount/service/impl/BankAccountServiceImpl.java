package com.project.app.bankaccount.service.impl;

import com.project.app.bankaccount.service.BankAccountService;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.bankaccount.dto.request.BankAccountRequest;
import com.project.app.bankaccount.dto.response.BankAccountResponse;
import com.project.app.bankaccount.entity.BankAccount;
import com.project.app.user.entity.User;
import com.project.app.bankaccount.repository.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankAccountServiceImpl implements BankAccountService {

    private final BankAccountRepository bankAccountRepository;

    // ====================== LẤY DANH SÁCH ======================
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
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION); // TODO: Thêm mã lỗi BANK_ACCOUNT_ALREADY_EXISTS
        }

        boolean isFirstAccount = bankAccountRepository.findByUserId(user.getId()).isEmpty();

        BankAccount bankAccount = BankAccount.builder()
                .user(user)
                .bankCode(request.getBankCode())
                .bankName(request.getBankName())
                .accountNumber(request.getAccountNumber())
                .accountName(request.getAccountName())
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
