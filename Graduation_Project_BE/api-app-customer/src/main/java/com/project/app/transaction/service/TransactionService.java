package com.project.app.transaction.service;

import com.project.app.transaction.dto.request.SePayWebhookRequest;
import com.project.app.transaction.dto.request.TopUpRequest;
import com.project.app.transaction.dto.response.TopUpResponse;
import com.project.app.transaction.entity.Transaction;
import com.project.app.user.entity.User;

import com.project.app.transaction.dto.request.TransferRequest;
import com.project.app.transaction.dto.response.TransferResponse;
import com.project.app.transaction.dto.request.WithdrawRequest;
import com.project.app.transaction.dto.request.ManualTransactionRequest;
import com.project.app.transaction.dto.response.WithdrawResponse;
import com.project.app.transaction.dto.response.ManualTransactionResponse;

public interface TransactionService {
    TopUpResponse initiateTopUp(User user, TopUpRequest request);
    void processSePayWebhook(String apikey, SePayWebhookRequest request);
    Transaction getTransactionByCode(String transactionCode, User user);
    Transaction updateTransaction(String transactionCode, User user, com.project.app.transaction.dto.request.UpdateTransactionRequest request);
    WithdrawResponse processWithdrawal(User user, WithdrawRequest request);
    TransferResponse processTransfer(User user, TransferRequest request);
    ManualTransactionResponse createManualTransaction(User user, ManualTransactionRequest request);
}
