package com.project.app.ai.service;

import com.project.app.budget.dto.response.BudgetResponse;
import com.project.app.budget.service.BudgetService;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryItemRepository;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FunctionCallingService {

    private final TransactionRepository transactionRepository;
    private final CategoryItemRepository categoryItemRepository;
    private final BudgetService budgetService;

    public Object executeFunction(String functionName, Map<String, Object> arguments, User currentUser) {
        log.info("Executing function: {} with args: {} for user: {}", functionName, arguments, currentUser.getEmail());
        try {
            switch (functionName) {
                case "getMonthlyStatistics":
                    return handleGetMonthlyStatistics(arguments, currentUser);
                case "getTransactions":
                    return handleGetTransactions(arguments, currentUser);
                case "getBudgets":
                    return handleGetBudgets(currentUser);
                case "getExpenseTrend":
                    return handleGetExpenseTrend(arguments, currentUser);
                default:
                    log.warn("Unknown function requested: {}", functionName);
                    return Map.of("error", "Unknown function: " + functionName);
            }
        } catch (Exception e) {
            log.error("Error executing function: {}", functionName, e);
            return Map.of("error", "Failed to execute function: " + e.getMessage());
        }
    }

    private Map<String, Object> handleGetMonthlyStatistics(Map<String, Object> arguments, User user) {
        int month = ((Number) arguments.get("month")).intValue();
        int year = ((Number) arguments.get("year")).intValue();

        LocalDateTime startOfMonth = LocalDate.of(year, month, 1).atStartOfDay();
        LocalDateTime endOfMonth = LocalDate.of(year, month, 1).plusMonths(1).atStartOfDay().minusNanos(1);

        // Fetch transactions for the user within month range
        List<Transaction> transactions = transactionRepository.findByUserAndStatusAndCreatedAtBetween(
                user, TransactionStatus.SUCCESS, startOfMonth, endOfMonth
        );

        if (transactions == null) {
            transactions = Collections.emptyList();
        }

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        Map<Long, BigDecimal> categorySums = new HashMap<>();

        for (Transaction t : transactions) {
            if (t.getType() == TransactionType.INCOME || t.getType() == TransactionType.RECEIVE_TRANSFER || t.getType() == TransactionType.TOP_UP) {
                totalIncome = totalIncome.add(t.getAmount());
            } else {
                totalExpense = totalExpense.add(t.getAmount());
                if (t.getCategoryId() != null) {
                    categorySums.put(t.getCategoryId(), categorySums.getOrDefault(t.getCategoryId(), BigDecimal.ZERO).add(t.getAmount()));
                }
            }
        }

        // Fetch category labels
        List<Map<String, Object>> topCategories = categorySums.entrySet().stream()
                .map(entry -> {
                    String label = categoryItemRepository.findById(entry.getKey())
                            .map(CategoryItem::getLabel)
                            .orElse("Khác");
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("categoryId", entry.getKey());
                    m.put("categoryName", label);
                    m.put("amount", entry.getValue());
                    return m;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("amount")).compareTo((BigDecimal) a.get("amount")))
                .collect(Collectors.toList());

        return Map.of(
                "month", month,
                "year", year,
                "totalIncome", totalIncome,
                "totalExpense", totalExpense,
                "netSavings", totalIncome.subtract(totalExpense),
                "topCategories", topCategories
        );
    }

    private List<Map<String, Object>> handleGetTransactions(Map<String, Object> arguments, User user) {
        int limit = arguments.containsKey("limit") ? ((Number) arguments.get("limit")).intValue() : 20;

        List<Transaction> transactions = transactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        if (transactions == null) {
            return Collections.emptyList();
        }

        return transactions.stream()
                .limit(limit)
                .map(t -> {
                    String categoryLabel = "Không có";
                    if (t.getCategoryId() != null) {
                        categoryLabel = categoryItemRepository.findById(t.getCategoryId())
                                .map(CategoryItem::getLabel)
                                .orElse("Khác");
                    }

                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", t.getId());
                    m.put("amount", t.getAmount());
                    m.put("type", t.getType().name());
                    m.put("status", t.getStatus().name());
                    m.put("note", t.getNote() != null ? t.getNote() : "");
                    m.put("category", categoryLabel);
                    m.put("date", t.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                    return m;
                })
                .collect(Collectors.toList());
    }

    private List<BudgetResponse> handleGetBudgets(User user) {
        return budgetService.getUserBudgets(user);
    }

    private List<Map<String, Object>> handleGetExpenseTrend(Map<String, Object> arguments, User user) {
        int monthsCount = ((Number) arguments.get("monthsCount")).intValue();

        List<Map<String, Object>> trends = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = monthsCount - 1; i >= 0; i--) {
            LocalDate targetDate = now.minusMonths(i);
            int m = targetDate.getMonthValue();
            int y = targetDate.getYear();

            LocalDateTime start = LocalDate.of(y, m, 1).atStartOfDay();
            LocalDateTime end = LocalDate.of(y, m, 1).plusMonths(1).atStartOfDay().minusNanos(1);

            List<Transaction> transactions = transactionRepository.findByUserAndStatusAndCreatedAtBetween(
                    user, TransactionStatus.SUCCESS, start, end
            );

            BigDecimal monthlyExpense = BigDecimal.ZERO;
            Map<String, BigDecimal> categoryBreakdown = new HashMap<>();

            if (transactions != null) {
                for (Transaction t : transactions) {
                    if (t.getType() != TransactionType.INCOME && t.getType() != TransactionType.RECEIVE_TRANSFER && t.getType() != TransactionType.TOP_UP) {
                        monthlyExpense = monthlyExpense.add(t.getAmount());
                        if (t.getCategoryId() != null) {
                            String label = categoryItemRepository.findById(t.getCategoryId())
                                    .map(CategoryItem::getLabel)
                                    .orElse("Khác");
                            categoryBreakdown.put(label, categoryBreakdown.getOrDefault(label, BigDecimal.ZERO).add(t.getAmount()));
                        }
                    }
                }
            }

            trends.add(Map.of(
                    "period", String.format("%02d/%d", m, y),
                    "totalExpense", monthlyExpense,
                    "categories", categoryBreakdown
            ));
        }

        return trends;
    }
}
