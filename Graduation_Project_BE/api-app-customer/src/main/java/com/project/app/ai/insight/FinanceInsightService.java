package com.project.app.ai.insight;

import com.project.app.ai.dto.response.HomeInsightResponse;
import com.project.app.budget.dto.BudgetSourceSpend;
import com.project.app.budget.dto.response.BudgetResponse;
import com.project.app.budget.enums.BudgetStatus;
import com.project.app.budget.service.BudgetService;
import com.project.app.report.dto.response.FinanceCenterResponse;
import com.project.app.report.dto.response.ReportDistributionResponse;
import com.project.app.report.service.ReportService;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class FinanceInsightService {

    private static final DecimalFormat MONEY = new DecimalFormat("#,###", new DecimalFormatSymbols(Locale.US));

    private final ReportService reportService;
    private final BudgetService budgetService;

    @Transactional(readOnly = true)
    public HomeInsightResponse buildHomeInsight(User user) {
        if (user == null || user.getId() == null) {
            return fallback("Đăng nhập để xem gợi ý tài chính cá nhân.");
        }

        LocalDate today = LocalDate.now();
        FinanceCenterResponse finance = reportService.getFinanceCenter(user, "MONTH", today, null);
        List<ReportDistributionResponse> distribution = reportService.getDistributionReport(
                user, TransactionType.EXPENSE, "month", today);
        List<BudgetResponse> activeBudgets = budgetService.listBudgets(user.getId()).stream()
                .filter(b -> b.getStatus() == BudgetStatus.ACTIVE)
                .toList();

        List<InsightCandidate> candidates = new ArrayList<>();
        candidates.addAll(budgetCandidates(activeBudgets));
        candidates.add(expenseDeltaCandidate(finance));
        candidates.add(topCategoryCandidate(finance, distribution));
        candidates.add(netDeltaCandidate(finance));
        candidates.add(assetCandidate(finance));
        candidates.add(emptyActivityCandidate(finance));

        InsightCandidate best = candidates.stream()
                .filter(c -> c != null && c.message() != null && !c.message().isBlank())
                .max(Comparator.comparingInt(InsightCandidate::priority))
                .orElse(null);

        if (best == null) {
            return HomeInsightResponse.builder()
                    .message("Hỏi Trợ lý AI: \"Tháng này thu chi thế nào?\" để xem báo cáo nhanh.")
                    .periodLabel(finance.getCurrentLabel())
                    .insightType("GENERAL")
                    .hints(List.of(
                            "Tôi có bao nhiêu tiền?",
                            "Tháng này chi nhiều nhất ở đâu?",
                            "Tôi có vượt ngân sách không?"))
                    .build();
        }

        return HomeInsightResponse.builder()
                .message(best.message())
                .periodLabel(finance.getCurrentLabel())
                .insightType(best.type())
                .hints(best.hints())
                .build();
    }

    private List<InsightCandidate> budgetCandidates(List<BudgetResponse> budgets) {
        List<InsightCandidate> list = new ArrayList<>();
        for (BudgetResponse budget : budgets) {
            if (!isOverLimit(budget)) {
                continue;
            }
            BigDecimal spent = totalSpent(budget);
            list.add(new InsightCandidate(
                    100,
                    "BUDGET_OVER",
                    String.format(
                            "Ngân sách \"%s\" đã vượt hạn mức: chi %s / %s. Cân nhắc giảm chi hoặc điều chỉnh ngân sách.",
                            budget.getCategoryName(),
                            money(spent),
                            money(budget.getLimitAmount())),
                    List.of("Tôi có vượt ngân sách không?", "Mở ngân sách")));
        }
        return list;
    }

    private InsightCandidate expenseDeltaCandidate(FinanceCenterResponse finance) {
        FinanceCenterResponse.AmountDelta delta = finance.getDelta().getTotalExpense();
        if (delta == null) {
            return null;
        }

        BigDecimal current = nz(finance.getCurrent().getTotalExpense());
        BigDecimal compare = nz(finance.getCompare().getTotalExpense());
        if (current.compareTo(BigDecimal.ZERO) == 0 && compare.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }

        BigDecimal amount = nz(delta.getAmount());
        if (amount.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }

        boolean spentLess = amount.compareTo(BigDecimal.ZERO) < 0;
        String pctText = formatPercent(delta.getPercent());
        String message;
        if (spentLess) {
            message = String.format(
                    "Tháng này bạn chi tiêu ít hơn %s so với %s (%s). Hãy duy trì nếu phù hợp mục tiêu tiết kiệm.",
                    pctText,
                    finance.getCompareLabel(),
                    money(amount.abs()));
        } else {
            message = String.format(
                    "Tháng này bạn chi tiêu nhiều hơn %s so với %s (%s). Xem lại các khoản chi lớn nhé.",
                    pctText,
                    finance.getCompareLabel(),
                    money(amount));
        }

        return new InsightCandidate(80, "EXPENSE_DELTA", message, List.of(
                "So sánh tháng này với tháng trước",
                "Tháng này chi nhiều nhất ở đâu?"));
    }

    private InsightCandidate topCategoryCandidate(
            FinanceCenterResponse finance,
            List<ReportDistributionResponse> distribution) {

        if (distribution == null || distribution.isEmpty()) {
            return null;
        }

        ReportDistributionResponse top = distribution.get(0);
        if (top.getTotalAmount() == null || top.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        String pct = top.getPercentage() != null
                ? String.format("%.0f%%", top.getPercentage())
                : "";

        return new InsightCandidate(
                70,
                "TOP_CATEGORY",
                String.format(
                        "%s — \"%s\" chi nhiều nhất (%s%s).",
                        finance.getCurrentLabel(),
                        top.getCategoryName(),
                        money(top.getTotalAmount()),
                        pct.isBlank() ? "" : ", " + pct),
                List.of("Chi tiêu theo danh mục tháng này"));
    }

    private InsightCandidate netDeltaCandidate(FinanceCenterResponse finance) {
        FinanceCenterResponse.AmountDelta delta = finance.getDelta().getNet();
        if (delta == null) {
            return null;
        }

        BigDecimal amount = nz(delta.getAmount());
        if (amount.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }

        boolean improved = amount.compareTo(BigDecimal.ZERO) > 0;
        String message = String.format(
                "Dòng tiền ròng %s %s so với %s (%s).",
                improved ? "tăng" : "giảm",
                money(amount.abs()),
                finance.getCompareLabel(),
                formatPercent(delta.getPercent()));

        return new InsightCandidate(60, "NET_DELTA", message, List.of("Tháng này thu chi thế nào?"));
    }

    private InsightCandidate assetCandidate(FinanceCenterResponse finance) {
        BigDecimal total = nz(finance.getTotalAssets());
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        double walletPct = finance.getWalletBalancePercent() != null ? finance.getWalletBalancePercent() : 0d;
        double cashPct = finance.getCashBalancePercent() != null ? finance.getCashBalancePercent() : 0d;

        return new InsightCandidate(
                50,
                "ASSET_ALLOCATION",
                String.format(
                        "Tổng tài sản %s — %.0f%% ở ví, %.0f%% ở sổ tay tiền mặt.",
                        money(total),
                        walletPct,
                        cashPct),
                List.of("Tiền đang nằm ở ví hay sổ tay?"));
    }

    private InsightCandidate emptyActivityCandidate(FinanceCenterResponse finance) {
        BigDecimal income = nz(finance.getCurrent().getTotalIncome());
        BigDecimal expense = nz(finance.getCurrent().getTotalExpense());
        if (income.compareTo(BigDecimal.ZERO) > 0 || expense.compareTo(BigDecimal.ZERO) > 0) {
            return null;
        }

        return new InsightCandidate(
                40,
                "NO_ACTIVITY",
                String.format(
                        "%s chưa ghi nhận thu/chi trên ví hoặc sổ tay. Ghi giao dịch để AI phân tích chính xác hơn.",
                        finance.getCurrentLabel()),
                List.of("Trung tâm tài chính là gì?"));
    }

    private boolean isOverLimit(BudgetResponse budget) {
        if (budget.getNotebook() != null && budget.getNotebook().isOverLimit()) {
            return true;
        }
        return budget.getWallet() != null && budget.getWallet().isOverLimit();
    }

    private BigDecimal totalSpent(BudgetResponse budget) {
        BigDecimal spent = BigDecimal.ZERO;
        if (budget.getNotebook() != null) {
            spent = spent.add(nz(budget.getNotebook().getSpent()));
        }
        if (budget.getWallet() != null) {
            spent = spent.add(nz(budget.getWallet().getSpent()));
        }
        BudgetSourceSpend primary = budget.getNotebook() != null ? budget.getNotebook() : budget.getWallet();
        if (primary != null && spent.compareTo(BigDecimal.ZERO) == 0) {
            return nz(primary.getSpent());
        }
        return spent;
    }

    private String formatPercent(Double percent) {
        if (percent == null) {
            return "—";
        }
        double abs = Math.abs(percent);
        String rounded = abs >= 10 ? String.format("%.0f", abs) : String.format("%.1f", abs);
        return rounded + "%";
    }

    private String money(BigDecimal value) {
        return MONEY.format(nz(value).longValue()) + " đ";
    }

    private BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private HomeInsightResponse fallback(String message) {
        return HomeInsightResponse.builder()
                .message(message)
                .insightType("GENERAL")
                .build();
    }

    private record InsightCandidate(int priority, String type, String message, List<String> hints) {
    }
}
