package com.project.app.dashboard.service;

import com.project.app.notification.repository.NotificationRepository;
import com.project.app.support.enums.SupportTicketStatus;
import com.project.app.support.repository.SupportTicketRepository;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.Role;
import com.project.app.user.repository.UserRepository;
import com.project.app.wallet.enums.WalletType;
import com.project.app.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> overview() {
        var users = userRepository.findAll().stream().filter(user -> user.getRole() == Role.USER).toList();
        var wallets = walletRepository.findAll().stream()
                .filter(wallet -> wallet.getWalletType() == WalletType.MAIN).toList();
        var transactions = transactionRepository.findAllWithUserAndWalletOrderByCreatedAtDesc().stream()
                .filter(tx -> tx.getWallet() != null && tx.getWallet().getWalletType() == WalletType.MAIN)
                .filter(this::isTopUpOrWithdraw).toList();
        var tickets = supportTicketRepository.findAll();
        var notifications = notificationRepository.findAll();

        BigDecimal walletBalance = wallets.stream().map(wallet -> wallet.getBalance())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal topUpAmount = successfulAmount(transactions, TransactionType.TOP_UP);
        BigDecimal withdrawAmount = successfulAmount(transactions, TransactionType.WITHDRAW);

        long pendingTransactions = transactions.stream().filter(tx -> tx.getStatus() == TransactionStatus.PENDING).count();
        long failedTransactions = transactions.stream().filter(tx -> tx.getStatus() == TransactionStatus.FAILED).count();
        long successfulTransactions = transactions.stream().filter(tx -> tx.getStatus() == TransactionStatus.SUCCESS).count();
        long openTickets = tickets.stream().filter(ticket -> ticket.getStatus() != SupportTicketStatus.CLOSED).count();
        long unreadNotifications = notifications.stream().filter(notification -> !notification.isRead()).count();

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("users", users.size());
        metrics.put("activeUsers", users.stream().filter(user -> user.isActive()).count());
        metrics.put("lockedUsers", users.stream().filter(user -> !user.isActive()).count());
        metrics.put("walletBalance", walletBalance);
        metrics.put("topUpAmount", topUpAmount);
        metrics.put("withdrawAmount", withdrawAmount);
        metrics.put("transactions", transactions.size());
        metrics.put("successfulTransactions", successfulTransactions);
        metrics.put("pendingTransactions", pendingTransactions);
        metrics.put("failedTransactions", failedTransactions);
        metrics.put("openTickets", openTickets);
        metrics.put("unreadNotifications", unreadNotifications);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("metrics", metrics);
        response.put("trend", buildTrend(transactions));
        response.put("recentTransactions", transactions.stream().limit(8).map(this::transactionRow).toList());
        response.put("alerts", buildAlerts(pendingTransactions, failedTransactions, openTickets));
        return response;
    }

    private BigDecimal successfulAmount(List<Transaction> transactions, TransactionType type) {
        return transactions.stream()
                .filter(tx -> tx.getType() == type && tx.getStatus() == TransactionStatus.SUCCESS)
                .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<Map<String, Object>> buildTrend(List<Transaction> transactions) {
        List<Map<String, Object>> trend = new ArrayList<>();
        for (int offset = 6; offset >= 0; offset--) {
            LocalDate date = LocalDate.now().minusDays(offset);
            BigDecimal topUp = transactions.stream()
                    .filter(tx -> tx.getCreatedAt() != null && tx.getCreatedAt().toLocalDate().equals(date))
                    .filter(tx -> tx.getType() == TransactionType.TOP_UP && tx.getStatus() == TransactionStatus.SUCCESS)
                    .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal withdraw = transactions.stream()
                    .filter(tx -> tx.getCreatedAt() != null && tx.getCreatedAt().toLocalDate().equals(date))
                    .filter(tx -> tx.getType() == TransactionType.WITHDRAW && tx.getStatus() == TransactionStatus.SUCCESS)
                    .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", date);
            point.put("topUp", topUp);
            point.put("withdraw", withdraw);
            trend.add(point);
        }
        return trend;
    }

    private Map<String, Object> transactionRow(Transaction tx) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", tx.getId());
        row.put("transactionCode", tx.getTransactionCode());
        row.put("username", tx.getUser() != null ? tx.getUser().getUsername() : null);
        row.put("type", tx.getType() != null ? tx.getType().name() : null);
        row.put("status", tx.getStatus() != null ? tx.getStatus().name() : null);
        row.put("amount", tx.getAmount());
        row.put("createdAt", tx.getCreatedAt());
        return row;
    }

    private List<Map<String, Object>> buildAlerts(long pending, long failed, long tickets) {
        List<Map<String, Object>> alerts = new ArrayList<>();
        addAlert(alerts, "Giao dịch chờ xử lý", pending, "PENDING_TRANSACTION", "/transaction-history", 1);
        addAlert(alerts, "Giao dịch thất bại", failed, "FAILED_TRANSACTION", "/transaction-history", 2);
        addAlert(alerts, "Ticket cần phản hồi", tickets, "OPEN_TICKET", "/support", 1);
        return alerts.stream().sorted(Comparator.comparing(item -> (Integer) item.get("severity"), Comparator.reverseOrder())).toList();
    }

    private boolean isTopUpOrWithdraw(Transaction transaction) {
        return transaction.getType() == TransactionType.TOP_UP || transaction.getType() == TransactionType.WITHDRAW;
    }

    private void addAlert(List<Map<String, Object>> alerts, String title, long count, String type, String route, int severity) {
        if (count <= 0) return;
        Map<String, Object> alert = new LinkedHashMap<>();
        alert.put("type", type);
        alert.put("title", title);
        alert.put("count", count);
        alert.put("route", route);
        alert.put("severity", severity);
        alerts.add(alert);
    }
}
