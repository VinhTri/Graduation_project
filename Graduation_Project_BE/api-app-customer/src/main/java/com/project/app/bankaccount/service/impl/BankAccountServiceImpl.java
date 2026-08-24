package com.project.app.bankaccount.service.impl;

import com.project.app.bankaccount.dto.request.BankAccountRequest;
import com.project.app.bankaccount.dto.response.BankAccountResponse;
import com.project.app.bankaccount.entity.BankAccount;
import com.project.app.bankaccount.repository.BankAccountRepository;
import com.project.app.bankaccount.service.BankAccountService;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankAccountServiceImpl implements BankAccountService {

    private static final int MAX_BANK_ACCOUNTS = 3;

    private final BankAccountRepository bankAccountRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BankAccountResponse> getBankAccounts(User user) {
        return bankAccountRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BankAccountResponse addBankAccount(User user, BankAccountRequest request) {
        String accountNumber = request.getAccountNumber().trim();

        if (bankAccountRepository.existsByAccountNumberAndUserId(accountNumber, user.getId())) {
            throw new AppException(ErrorCode.BANK_ACCOUNT_ALREADY_EXISTS);
        }

        List<BankAccount> existingAccounts = bankAccountRepository.findByUserId(user.getId());
        if (existingAccounts.size() >= MAX_BANK_ACCOUNTS) {
            throw new AppException(ErrorCode.BANK_ACCOUNT_LIMIT_REACHED);
        }

        String accountName = resolveAccountName(user, request.getAccountName());
        boolean isFirstAccount = existingAccounts.isEmpty();

        BankAccount bankAccount = BankAccount.builder()
                .user(user)
                .bankCode(request.getBankCode().trim())
                .bankName(request.getBankName().trim())
                .accountNumber(accountNumber)
                .accountName(accountName)
                .isDefault(isFirstAccount)
                .build();

        return mapToResponse(bankAccountRepository.save(bankAccount));
    }

    @Override
    @Transactional
    public void deleteBankAccount(User user, Long accountId) {
        BankAccount bankAccount = bankAccountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND));

        bankAccountRepository.delete(bankAccount);

        if (bankAccount.isDefault()) {
            List<BankAccount> remainingAccounts = bankAccountRepository.findByUserId(user.getId());
            if (!remainingAccounts.isEmpty()) {
                BankAccount newDefault = remainingAccounts.get(0);
                newDefault.setDefault(true);
                bankAccountRepository.save(newDefault);
            }
        }
    }

    private String resolveAccountName(User user, String requestedName) {
        if (requestedName != null && !requestedName.isBlank()) {
            return requestedName.trim().toUpperCase();
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername().trim().toUpperCase();
        }
        String localPart = user.getEmail().split("@")[0];
        return localPart.replace('.', ' ').replace('_', ' ').trim().toUpperCase();
    }

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
