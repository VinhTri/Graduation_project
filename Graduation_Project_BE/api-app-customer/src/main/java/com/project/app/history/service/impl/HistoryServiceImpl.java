package com.project.app.history.service.impl;

import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryItemRepository;
import com.project.app.history.dto.response.TransactionHistoryResponse;
import com.project.app.history.service.HistoryService;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.User;
import com.project.app.wallet.enums.WalletType;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class HistoryServiceImpl implements HistoryService {

    private final TransactionRepository transactionRepository;
    private final CategoryItemRepository categoryItemRepository;

    public HistoryServiceImpl(TransactionRepository transactionRepository,
                              CategoryItemRepository categoryItemRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryItemRepository = categoryItemRepository;
    }

    @Override
    public List<TransactionHistoryResponse> getTransactionHistory(User user) {
        return getTransactionHistory(user, "main");
    }

    @Override
    public List<TransactionHistoryResponse> getTransactionHistory(User user, String wallet) {
        List<Transaction> transactions;
        if (wallet != null && wallet.equalsIgnoreCase("cash")) {
            transactions = transactionRepository.findByUserIdAndWallet_WalletTypeOrderByCreatedAtDesc(
                    user.getId(), WalletType.CASH);
        } else if (wallet != null && wallet.matches("\\d+")) {
            // It's a walletId
            Long walletId = Long.parseLong(wallet);
            transactions = transactionRepository.findByUserIdAndWalletIdOrderByCreatedAtDesc(user.getId(), walletId);
        } else {
            transactions = transactionRepository.findByUserIdAndWallet_IsDefaultTrueOrderByCreatedAtDesc(
                    user.getId());
        }

        Set<Long> categoryIds = transactions.stream()
                .map(Transaction::getCategoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, CategoryItem> categoryMap = categoryItemRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(CategoryItem::getId, item -> item));

        return transactions.stream()
                .map(t -> mapToResponse(t, categoryMap.get(t.getCategoryId())))
                .collect(Collectors.toList());
    }

    private TransactionHistoryResponse mapToResponse(Transaction transaction, CategoryItem category) {
        Long categoryId = transaction.getCategoryId();
        String categoryLabel = null;
        String categoryIcon = null;
        String categoryColor = null;
        Boolean categoryDeleted = null;

        if (categoryId != null) {
            if (category != null) {
                categoryLabel = category.getLabel();
                categoryIcon = category.getIcon();
                categoryColor = category.getColor();
                categoryDeleted = category.isDeleted();
            } else {
                categoryDeleted = true;
            }
        }

        return new TransactionHistoryResponse(
                transaction.getTransactionCode(),
                transaction.getType(),
                transaction.getStatus(),
                transaction.getAmount(),
                transaction.getNote(),
                categoryId,
                categoryLabel,
                categoryIcon,
                categoryColor,
                categoryDeleted,
                transaction.getCreatedAt()
        );
    }
}
