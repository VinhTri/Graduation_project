package com.project.app.transaction.service;

import com.project.app.transaction.dto.request.SePayWebhookRequest;
import com.project.app.transaction.dto.request.TopUpRequest;
import com.project.app.transaction.dto.response.TopUpResponse;
import com.project.app.transaction.entity.Transaction;
import com.project.app.user.entity.User;

import com.project.app.transaction.dto.request.WithdrawRequest;
import com.project.app.transaction.dto.response.WithdrawResponse;

public interface TransactionService {
    TopUpResponse initiateTopUp(User user, TopUpRequest request);
    void processSePayWebhook(SePayWebhookRequest request);
    Transaction getTransactionByCode(String transactionCode, User user);
    WithdrawResponse processWithdrawal(User user, WithdrawRequest request);
    TopUpResponse getPendingTopUp(User user);
    void cancelTransaction(String transactionCode, User user);
}
