package com.project.app.notebook.service;

import com.project.app.notebook.dto.NotebookTransactionResponse;
import com.project.app.notebook.dto.request.NotebookTransactionRequest;

import java.util.List;

public interface NotebookTransactionService {

    List<NotebookTransactionResponse> getTransactions(Long userId, Long bookId, String period);

    NotebookTransactionResponse getTransaction(Long userId, String transactionCode);

    NotebookTransactionResponse createTransaction(Long userId, NotebookTransactionRequest request);

    NotebookTransactionResponse updateTransaction(
            Long userId,
            String transactionCode,
            NotebookTransactionRequest request);

    void deleteTransaction(Long userId, String transactionCode);
}
