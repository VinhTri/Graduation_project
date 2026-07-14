package com.project.app.history.service.impl;

import com.project.app.history.dto.response.TransactionHistoryResponse;
import com.project.app.history.service.HistoryService;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HistoryServiceImpl implements HistoryService {

    private final TransactionRepository transactionRepository;

    public HistoryServiceImpl(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Override
    public List<TransactionHistoryResponse> getTransactionHistory(User user) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return transactions.stream().map(t -> new TransactionHistoryResponse(
                t.getTransactionCode(),
                t.getType(),
                t.getStatus(),
                t.getAmount(),
                t.getNote(),
                t.getCategoryId(),
                t.getCreatedAt()
        )).collect(Collectors.toList());
    }
}
