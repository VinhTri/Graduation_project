package com.project.app.bankaccount.service;

import com.project.app.bankaccount.dto.request.BankAccountRequest;
import com.project.app.bankaccount.dto.response.BankAccountResponse;
import com.project.app.user.entity.User;

import java.util.List;

public interface BankAccountService {
    List<BankAccountResponse> getBankAccounts(User user);
    BankAccountResponse addBankAccount(User user, BankAccountRequest request);
    void deleteBankAccount(User user, Long accountId);
}
