package com.project.app.ai.service;

import com.project.app.report.service.ReportService;
import com.project.app.user.entity.User;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiContextService {

    private final WalletRepository walletRepository;
    private final ReportService reportService;

    public Map<String, Object> fetchUserAccountContext(User user) {
        Map<String, Object> ctx = new HashMap<>();
        if (user == null) {
            ctx.put("username", "Người dùng SmartSpend");
            ctx.put("email", "");
            ctx.put("totalBalance", BigDecimal.ZERO);
            ctx.put("mainBalance", BigDecimal.ZERO);
            ctx.put("cashBalance", BigDecimal.ZERO);
            ctx.put("hasData", false);
            ctx.put("budgetsStr", "Chưa có ngân sách nào");
            ctx.put("distStr", "Chưa có báo cáo chi tiêu");
            ctx.put("totalSpentMonth", BigDecimal.ZERO);
            ctx.put("hasExpenseData", false);
            return ctx;
        }

        ctx.put("username", user.getUsername() != null ? user.getUsername() : user.getEmail());
        ctx.put("email", user.getEmail() != null ? user.getEmail() : "");

        BigDecimal mainBalance = BigDecimal.ZERO;
        BigDecimal cashBalance = BigDecimal.ZERO;
        BigDecimal totalBalance = BigDecimal.ZERO;

        try {
            List<Wallet> wallets = walletRepository.findByUserId(user.getId());
            for (Wallet w : wallets) {
                if (w.getBalance() != null) {
                    totalBalance = totalBalance.add(w.getBalance());
                }
                if (w.isDefault()) {
                    mainBalance = w.getBalance() != null ? w.getBalance() : BigDecimal.ZERO;
                } else if ("CASH".equalsIgnoreCase(w.getWalletType() != null ? w.getWalletType().name() : "")) {
                    cashBalance = w.getBalance() != null ? w.getBalance() : BigDecimal.ZERO;
                }
            }
        } catch (Exception e) {
            log.error("Error fetching user wallets", e);
        }

        ctx.put("totalBalance", totalBalance);
        ctx.put("mainBalance", mainBalance);
        ctx.put("cashBalance", cashBalance);

        // Fetch actual expense distribution from ReportService
        BigDecimal totalSpentMonth = BigDecimal.ZERO;
        String topCategoryName = null;
        BigDecimal topCategoryAmount = BigDecimal.ZERO;
        Double topCategoryPercentage = 0.0;
        
        String secondCategoryName = null;
        BigDecimal secondCategoryAmount = BigDecimal.ZERO;
        Double secondCategoryPercentage = 0.0;

        String distStr = "Chưa có phát sinh chi tiêu tháng này";

        try {
            List<com.project.app.report.dto.response.ReportDistributionResponse> distribution = 
                    reportService.getDistributionReport(user, com.project.app.transaction.enums.TransactionType.EXPENSE, "MONTH", java.time.LocalDate.now());
            if (distribution != null && !distribution.isEmpty()) {
                distribution.sort((a, b) -> {
                    BigDecimal amtA = a.getTotalAmount() != null ? a.getTotalAmount() : BigDecimal.ZERO;
                    BigDecimal amtB = b.getTotalAmount() != null ? b.getTotalAmount() : BigDecimal.ZERO;
                    return amtB.compareTo(amtA);
                });

                DecimalFormat df = new DecimalFormat("#,###");
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < distribution.size(); i++) {
                    com.project.app.report.dto.response.ReportDistributionResponse d = distribution.get(i);
                    if (d.getTotalAmount() != null && d.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
                        totalSpentMonth = totalSpentMonth.add(d.getTotalAmount());
                        if (i == 0) {
                            topCategoryName = d.getCategoryName();
                            topCategoryAmount = d.getTotalAmount();
                            topCategoryPercentage = d.getPercentage() != null ? d.getPercentage() : 0.0;
                        } else if (i == 1) {
                            secondCategoryName = d.getCategoryName();
                            secondCategoryAmount = d.getTotalAmount();
                            secondCategoryPercentage = d.getPercentage() != null ? d.getPercentage() : 0.0;
                        }
                        sb.append(String.format("- %s: %s VNĐ (%.1f%%)\n", d.getCategoryName(), df.format(d.getTotalAmount()), d.getPercentage() != null ? d.getPercentage() : 0.0));
                    }
                }
                if (sb.length() > 0) {
                    distStr = sb.toString();
                }
            }
        } catch (Exception e) {
            log.error("Error fetching expense distribution report", e);
        }

        ctx.put("distStr", distStr);
        ctx.put("totalSpentMonth", totalSpentMonth);
        ctx.put("topCategoryName", topCategoryName);
        ctx.put("topCategoryAmount", topCategoryAmount);
        ctx.put("topCategoryPercentage", topCategoryPercentage);
        ctx.put("secondCategoryName", secondCategoryName);
        ctx.put("secondCategoryAmount", secondCategoryAmount);
        ctx.put("secondCategoryPercentage", secondCategoryPercentage);
        ctx.put("hasExpenseData", totalSpentMonth.compareTo(BigDecimal.ZERO) > 0);
        ctx.put("hasData", totalBalance.compareTo(BigDecimal.ZERO) > 0 || totalSpentMonth.compareTo(BigDecimal.ZERO) > 0);

        return ctx;
    }
}
