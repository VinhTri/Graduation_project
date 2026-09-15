package com.project.app.ai.finance;

import com.project.app.ai.dto.response.AiActionDto;
import com.project.app.ai.dto.response.AiCardDto;
import com.project.app.ai.dto.response.AiCardItemDto;
import com.project.app.ai.tool.dto.ToolResultDto;
import org.springframework.stereotype.Component;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Component
public class FinanceResponseBuilder {

    private static final DecimalFormat MONEY = new DecimalFormat("#,###", new DecimalFormatSymbols(Locale.US));

    public String buildGuideText() {
        return """
                Trung tâm tài chính giúp bạn xem số dư (ví SmartSpend + sổ tay tiền mặt), dòng tiền thu/chi/ròng theo tuần/tháng/năm và so sánh với kỳ trước.

                Bạn có thể hỏi tôi ví dụ:
                • "Tôi có bao nhiêu tiền?"
                • "Tháng này thu chi thế nào?"
                • "So sánh tháng này với tháng trước"
                • "Tiền đang nằm ở ví hay sổ tay?"
                • "Tháng này chi nhiều nhất ở danh mục nào?"
                • "Tôi có vượt ngân sách không?"

                Lưu ý: tổng tài sản = ví + sổ tay; quỹ tiết kiệm hiển thị riêng (nạp/rút trong kỳ).""";
    }

    public String buildOutOfScopeText(FinanceIntent intent) {
        return switch (intent) {
            case FUND_BALANCE -> """
                    Trung tâm tài chính chỉ hiển thị nạp/rút quỹ trong kỳ, không phải số dư quỹ tổng.
                    Xem số dư từng quỹ tại màn Quỹ tiết kiệm.""";
            default -> "Tôi chưa hỗ trợ câu hỏi này qua chat.";
        };
    }

    public List<AiActionDto> buildNavigateActions(FinanceIntent intent) {
        if (intent == FinanceIntent.FUND_BALANCE) {
            return List.of(navigate("open_funds", "Mở Quỹ tiết kiệm", "/funds"));
        }
        if (intent == FinanceIntent.BUDGET_STATUS) {
            return List.of(navigate("open_budget", "Mở Ngân sách", "/budget"));
        }
        if (intent == FinanceIntent.SPENDING_BY_CATEGORY || intent == FinanceIntent.SPENDING_BY_CATEGORY_COMPARE
                || intent == FinanceIntent.SPENDING_ANALYSIS) {
            return List.of(navigate("open_finance_center", "Mở Trung tâm tài chính", "/finance-center"));
        }
        if (intent == FinanceIntent.GUIDE) {
            return List.of(navigate("open_finance_center", "Mở Trung tâm tài chính", "/finance-center"));
        }
        return List.of(navigate("open_finance_center", "Xem Trung tâm tài chính", "/finance-center"));
    }

    public String buildText(FinanceIntent intent, ToolResultDto toolResult) {
        if (toolResult == null || !toolResult.isSuccess() || toolResult.getData() == null) {
            return toolResult != null && toolResult.getMessage() != null
                    ? toolResult.getMessage()
                    : "Không lấy được báo cáo tài chính. Bạn thử lại sau nhé.";
        }

        Map<String, Object> data = toolResult.getData();
        return switch (intent) {
            case ASSETS_OVERVIEW -> buildAssetsOverview(data);
            case ASSETS_ALLOCATION -> buildAssetsAllocation(data);
            case PERIOD_OVERVIEW -> buildPeriodOverview(data);
            case FINANCIAL_HEALTH -> buildFinancialHealth(data);
            case SPENDING_ANALYSIS -> buildSpendingAnalysis(data);
            case PERIOD_INCOME -> buildPeriodIncome(data);
            case PERIOD_EXPENSE -> buildPeriodExpense(data);
            case PERIOD_NET -> buildPeriodNet(data);
            case SOURCE_WALLET -> buildSourceWallet(data);
            case SOURCE_CASH -> buildSourceCash(data);
            case SOURCE_FUND -> buildSourceFund(data);
            case COMPARE_OVERVIEW -> buildCompareOverview(data);
            case COMPARE_INCOME -> buildCompareIncome(data);
            case COMPARE_EXPENSE -> buildCompareExpense(data);
            case COMPARE_NET -> buildCompareNet(data);
            case COMPARE_WALLET -> buildCompareWallet(data);
            case COMPARE_CASH -> buildCompareCash(data);
            case DELTA_SUMMARY -> buildDeltaSummary(data);
            case SPENDING_BY_CATEGORY, SPENDING_BY_CATEGORY_COMPARE -> buildSpendingByCategory(data);
            case BUDGET_STATUS -> buildBudgetStatus(data);
            default -> buildTextByTool(toolResult, data);
        };
    }

    private String buildTextByTool(ToolResultDto toolResult, Map<String, Object> data) {
        if ("get_spending_by_category".equals(toolResult.getToolName())) {
            return buildSpendingByCategory(data);
        }
        if ("get_budget_status".equals(toolResult.getToolName())) {
            return buildBudgetStatus(data);
        }
        return buildPeriodOverview(data);
    }

    public AiCardDto buildCard(FinanceIntent intent, ToolResultDto toolResult) {
        if (toolResult == null || !toolResult.isSuccess() || toolResult.getData() == null) {
            return null;
        }

        Map<String, Object> data = toolResult.getData();
        List<AiCardItemDto> items = new ArrayList<>();
        String title;

        switch (intent) {
            case ASSETS_OVERVIEW -> {
                title = "Tài sản hiện tại";
                items.add(item("Tổng tài sản", money(data.get("totalAssets"))));
                items.add(item("Ví SmartSpend", money(data.get("walletBalance"))));
                items.add(item("Sổ tay tiền mặt", money(data.get("cashBalance"))));
            }
            case ASSETS_ALLOCATION -> {
                title = "Phân bổ tài sản";
                items.add(item("Ví", percent(data.get("walletBalancePercent"))));
                items.add(item("Sổ tay", percent(data.get("cashBalancePercent"))));
                items.add(item("Tổng", money(data.get("totalAssets"))));
            }
            case FINANCIAL_HEALTH -> {
                title = "Sức khỏe tài chính · " + label(data.get("currentLabel"));
                Map<String, Object> current = map(data.get("current"));
                double income = num(current.get("totalIncome"));
                double expense = num(current.get("totalExpense"));
                double net = num(current.get("net"));
                items.add(item("Tỷ lệ để dành", income > 0 ? percent(net / income * 100) : "Chưa xác định"));
                items.add(item("Chi / Thu", income > 0 ? percent(expense / income * 100) : "Chưa xác định"));
                items.add(item("Dòng tiền ròng", money(net)));
            }
            case SOURCE_WALLET -> {
                title = "Ví · " + label(data.get("currentLabel"));
                Map<String, Object> wallet = flow(data, "current", "wallet");
                items.add(item("Nạp", money(wallet.get("income"))));
                items.add(item("Rút", money(wallet.get("expense"))));
                items.add(item("Ròng", money(wallet.get("net"))));
            }
            case SOURCE_CASH -> {
                title = "Sổ tay · " + label(data.get("currentLabel"));
                Map<String, Object> cash = flow(data, "current", "cash");
                items.add(item("Thu", money(cash.get("income"))));
                items.add(item("Chi", money(cash.get("expense"))));
                items.add(item("Ròng", money(cash.get("net"))));
            }
            case SOURCE_FUND -> {
                title = "Quỹ · " + label(data.get("currentLabel"));
                Map<String, Object> fund = flow(data, "current", "fund");
                items.add(item("Nạp", money(fund.get("income"))));
                items.add(item("Rút", money(fund.get("expense"))));
                items.add(item("Ròng", money(fund.get("net"))));
            }
            case COMPARE_OVERVIEW, COMPARE_INCOME, COMPARE_EXPENSE, COMPARE_NET,
                 COMPARE_WALLET, COMPARE_CASH, DELTA_SUMMARY -> {
                title = "So sánh · " + label(data.get("currentLabel"));
                Map<String, Object> delta = map(data.get("delta"));
                items.add(item("Δ Thu", deltaMoney(delta, "totalIncome")));
                items.add(item("Δ Chi", deltaMoney(delta, "totalExpense")));
                items.add(item("Δ Ròng", deltaMoney(delta, "net")));
            }
            case SPENDING_BY_CATEGORY, SPENDING_BY_CATEGORY_COMPARE, SPENDING_ANALYSIS -> {
                title = spendingCardTitle(data);
                appendSpendingItems(items, data);
            }
            case BUDGET_STATUS -> {
                title = "Ngân sách đang hoạt động";
                appendBudgetItems(items, data);
            }
            default -> {
                if ("get_spending_by_category".equals(toolResult.getToolName())) {
                    title = spendingCardTitle(data);
                    appendSpendingItems(items, data);
                } else if ("get_budget_status".equals(toolResult.getToolName())) {
                    title = "Ngân sách đang hoạt động";
                    appendBudgetItems(items, data);
                } else {
                    title = label(data.get("currentLabel"));
                    Map<String, Object> current = map(data.get("current"));
                    items.add(item("Thu", money(current.get("totalIncome"))));
                    items.add(item("Chi", money(current.get("totalExpense"))));
                    items.add(item("Ròng", money(current.get("net"))));
                }
            }
        }

        if (items.isEmpty()) {
            return null;
        }

        String cardType = switch (intent) {
            case SPENDING_BY_CATEGORY, SPENDING_BY_CATEGORY_COMPARE, SPENDING_ANALYSIS -> "SPENDING_RANK";
            case BUDGET_STATUS -> "BUDGET_STATUS";
            default -> "get_spending_by_category".equals(toolResult.getToolName()) ? "SPENDING_RANK"
                    : "get_budget_status".equals(toolResult.getToolName()) ? "BUDGET_STATUS"
                    : "FINANCE_SUMMARY";
        };

        return AiCardDto.builder()
                .type(cardType)
                .title(title)
                .items(items)
                .build();
    }

    public FinanceIntent resolveIntent(String message, ToolResultDto toolResult) {
        if (toolResult != null && toolResult.getData() != null && toolResult.getData().get("financeIntent") != null) {
            try {
                return FinanceIntent.valueOf(toolResult.getData().get("financeIntent").toString());
            } catch (IllegalArgumentException ignored) {
                // fall through
            }
        }
        if (toolResult != null && "get_spending_by_category".equals(toolResult.getToolName())) {
            if (toolResult.getData() != null && Boolean.TRUE.equals(toolResult.getData().get("compareMode"))) {
                return FinanceIntent.SPENDING_BY_CATEGORY_COMPARE;
            }
            return FinanceIntent.SPENDING_BY_CATEGORY;
        }
        if (toolResult != null && "get_budget_status".equals(toolResult.getToolName())) {
            return FinanceIntent.BUDGET_STATUS;
        }
        return FinanceIntent.PERIOD_OVERVIEW;
    }

    private String buildSpendingByCategory(Map<String, Object> data) {
        List<?> currentTop = list(data.get("currentTop"));
        if (currentTop.isEmpty()) {
            return String.format(
                    "%s: chưa có chi tiêu theo danh mục trên ví (hoặc giao dịch chưa gắn danh mục).",
                    label(data.get("currentLabel")));
        }

        boolean compareMode = Boolean.TRUE.equals(data.get("compareMode"));
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%s — chi nhiều nhất: %s.",
                label(data.get("currentLabel")),
                formatTopSummary(currentTop, 3)));

        if (compareMode) {
            List<?> compareTop = list(data.get("compareTop"));
            sb.append(String.format("%n%s — chi nhiều nhất: %s.",
                    label(data.get("compareLabel")),
                    formatTopSummary(compareTop, 3)));
        }
        return sb.toString();
    }

    private String buildSpendingAnalysis(Map<String, Object> data) {
        List<?> rows = list(data.get("currentTop"));
        String period = label(data.get("currentLabel"));
        if (rows.isEmpty()) {
            return period + ": chưa có khoản chi được gắn danh mục để phân tích. Hãy gắn danh mục cho giao dịch rồi thử lại.";
        }

        Map<String, Object> first = map(rows.get(0));
        String category = stringValue(first.get("categoryName"));
        double amount = num(first.get("totalAmount"));
        double share = num(first.get("percentage"));
        String concentration = share >= 50
                ? "Khoản này chiếm tỷ trọng khá tập trung (" + String.format("%.1f", share) + "%)."
                : "Đây là khoản lớn nhất, chiếm " + String.format("%.1f", share) + "% tổng chi theo danh mục.";
        return String.format("%s: khoản nên rà soát trước là %s — %s. %s "
                        + "Tuy nhiên, số tiền lớn chưa đủ để kết luận là lãng phí; hãy mở các giao dịch trong danh mục này, "
                        + "đánh dấu khoản không thiết yếu rồi đặt hạn mức phù hợp.",
                period, category, money(amount), concentration);
    }

    private String buildBudgetStatus(Map<String, Object> data) {
        int active = (int) num(data.get("activeCount"));
        int over = (int) num(data.get("overLimitCount"));

        if (active == 0) {
            return "Bạn chưa có ngân sách đang hoạt động. Tạo ngân sách trong app để theo dõi hạn mức chi tiêu.";
        }

        if (over == 0) {
            return String.format(
                    "Bạn có %d ngân sách đang hoạt động và chưa vượt hạn mức. Chi tiết từng mục xem ở bảng bên dưới.",
                    active);
        }

        List<?> budgets = list(data.get("budgets"));
        List<String> overNames = new ArrayList<>();
        for (Object rowObj : budgets) {
            Map<String, Object> row = map(rowObj);
            if (Boolean.TRUE.equals(row.get("overLimit"))) {
                overNames.add(String.format("%s (%s/%s)",
                        stringValue(row.get("categoryName")),
                        money(row.get("spent")),
                        money(row.get("limitAmount"))));
            }
            if (overNames.size() >= 3) {
                break;
            }
        }

        return String.format(
                "Bạn có %d ngân sách đang hoạt động, %d mục đã vượt hạn mức: %s.",
                active,
                over,
                String.join("; ", overNames));
    }

    private void appendSpendingItems(List<AiCardItemDto> items, Map<String, Object> data) {
        for (Object rowObj : list(data.get("currentTop"))) {
            Map<String, Object> row = map(rowObj);
            String pct = row.get("percentage") != null
                    ? String.format(" (%.0f%%)", num(row.get("percentage")))
                    : "";
            items.add(AiCardItemDto.builder()
                    .label(stringValue(row.get("categoryName")))
                    .value(money(row.get("totalAmount")) + pct)
                    .color(stringValue(row.get("color")))
                    .build());
        }
    }

    private void appendBudgetItems(List<AiCardItemDto> items, Map<String, Object> data) {
        for (Object rowObj : list(data.get("budgets"))) {
            Map<String, Object> row = map(rowObj);
            if (items.size() >= 6) {
                break;
            }
            String suffix = Boolean.TRUE.equals(row.get("overLimit")) ? " · vượt" : "";
            items.add(AiCardItemDto.builder()
                    .label(stringValue(row.get("categoryName")))
                    .value(money(row.get("spent")) + " / " + money(row.get("limitAmount")) + suffix)
                    .color(stringValue(row.get("categoryColor")))
                    .build());
        }
    }

    private String spendingCardTitle(Map<String, Object> data) {
        if (Boolean.TRUE.equals(data.get("compareMode"))) {
            return "Top chi · " + label(data.get("currentLabel"));
        }
        return "Chi theo danh mục · " + label(data.get("currentLabel"));
    }

    private String formatTopSummary(List<?> rows, int limit) {
        List<String> parts = new ArrayList<>();
        int count = 0;
        for (Object rowObj : rows) {
            if (count >= limit) {
                break;
            }
            Map<String, Object> row = map(rowObj);
            parts.add(String.format("%s %s",
                    stringValue(row.get("categoryName")),
                    money(row.get("totalAmount"))));
            count++;
        }
        return parts.isEmpty() ? "chưa có dữ liệu" : String.join(", ", parts);
    }

    @SuppressWarnings("unchecked")
    private List<?> list(Object obj) {
        if (obj instanceof List<?> list) {
            return list;
        }
        return List.of();
    }

    private String stringValue(Object value) {
        return value != null ? value.toString() : "";
    }

    public ToolResultDto tagIntent(ToolResultDto toolResult, FinanceIntent intent) {
        if (toolResult == null || toolResult.getData() == null) {
            return toolResult;
        }
        Map<String, Object> data = new java.util.HashMap<>(toolResult.getData());
        data.put("financeIntent", intent.name());
        return ToolResultDto.builder()
                .toolName(toolResult.getToolName())
                .success(toolResult.isSuccess())
                .message(toolResult.getMessage())
                .data(data)
                .build();
    }

    private String buildAssetsOverview(Map<String, Object> data) {
        double total = num(data.get("totalAssets"));
        if (total <= 0) {
            return "Bạn chưa có số dư ví hoặc sổ tay. Hãy nạp ví hoặc ghi thu trên sổ tay tiền mặt để bắt đầu theo dõi.";
        }
        return String.format(
                "Tổng tài sản (ví + sổ tay): %s. Trong đó ví SmartSpend: %s, sổ tay tiền mặt: %s.",
                money(total), money(data.get("walletBalance")), money(data.get("cashBalance")));
    }

    private String buildAssetsAllocation(Map<String, Object> data) {
        double total = num(data.get("totalAssets"));
        if (total <= 0) {
            return "Chưa có tài sản để phân bổ. Tổng tài sản = số dư ví + sổ tay.";
        }
        return String.format(
                "Tài sản đang nằm %.0f%% ở ví và %.0f%% ở sổ tay tiền mặt (%s / %s).",
                num(data.get("walletBalancePercent")),
                num(data.get("cashBalancePercent")),
                money(data.get("walletBalance")),
                money(data.get("cashBalance")));
    }

    private String buildPeriodOverview(Map<String, Object> data) {
        Map<String, Object> current = map(data.get("current"));
        double income = num(current.get("totalIncome"));
        double expense = num(current.get("totalExpense"));
        if (income == 0 && expense == 0) {
            return String.format(
                    "%s: chưa ghi nhận thu/chi trên ví hoặc sổ tay.",
                    label(data.get("currentLabel")));
        }
        String netHint = num(current.get("net")) >= 0
                ? "Kỳ này dương — thu nhiều hơn chi."
                : "Kỳ này âm — chi nhiều hơn thu.";
        return String.format(
                "%s: Thu %s, chi %s, ròng %s (ví + sổ tay). %s",
                label(data.get("currentLabel")),
                money(income),
                money(expense),
                money(current.get("net")),
                netHint);
    }

    private String buildFinancialHealth(Map<String, Object> data) {
        Map<String, Object> current = map(data.get("current"));
        double income = num(current.get("totalIncome"));
        double expense = num(current.get("totalExpense"));
        double net = num(current.get("net"));
        String period = label(data.get("currentLabel"));

        if (income == 0 && expense == 0) {
            return period + ": chưa có dữ liệu thu–chi để đánh giá sức khỏe tài chính. "
                    + "Hãy ghi nhận giao dịch đầy đủ rồi đánh giá lại; một tháng đơn lẻ cũng chưa đủ để kết luận xu hướng dài hạn.";
        }
        if (income <= 0) {
            return String.format("%s: sức khỏe dòng tiền đang ở mức cần chú ý vì chưa ghi nhận thu nhưng đã chi %s. "
                            + "Bạn nên kiểm tra lại dữ liệu thu nhập và tạm ưu tiên các khoản thiết yếu; chưa thể tính tỷ lệ để dành.",
                    period, money(expense));
        }

        double expenseRate = expense / income * 100;
        double savingRate = net / income * 100;
        String assessment;
        String advice;
        if (net < 0) {
            assessment = "cần cải thiện";
            advice = "Chi đang vượt thu; hãy giảm khoản linh hoạt và đặt hạn mức để đưa dòng tiền về dương.";
        } else if (savingRate >= 20) {
            assessment = "tốt";
            advice = "Bạn đang vượt mốc tham khảo 20% để dành; nên ưu tiên quỹ khẩn cấp và duy trì mức này.";
        } else if (savingRate >= 10) {
            assessment = "khá ổn";
            advice = "Bạn vẫn có thặng dư, nhưng nên hướng dần tỷ lệ để dành lên khoảng 20% nếu điều kiện cho phép.";
        } else {
            assessment = "mong manh";
            advice = "Biên an toàn còn thấp; hãy rà soát khoản không thiết yếu và tạo một hạn mức theo tuần.";
        }
        return String.format("%s: sức khỏe dòng tiền ở mức %s. Thu %s, chi %s (%.1f%% thu nhập), "
                        + "ròng %s; tỷ lệ để dành %.1f%%. %s Đây là đánh giá từ dữ liệu đã ghi nhận trong một kỳ, không phải kết luận toàn bộ tình hình tài chính.",
                period, assessment, money(income), money(expense), expenseRate, money(net), savingRate, advice);
    }

    private String buildPeriodIncome(Map<String, Object> data) {
        Map<String, Object> current = map(data.get("current"));
        Map<String, Object> wallet = map(current.get("wallet"));
        Map<String, Object> cash = map(current.get("cash"));
        return String.format(
                "%s: Tổng thu %s (ví nạp %s, sổ tay thu %s).",
                label(data.get("currentLabel")),
                money(current.get("totalIncome")),
                money(wallet.get("income")),
                money(cash.get("income")));
    }

    private String buildPeriodExpense(Map<String, Object> data) {
        Map<String, Object> current = map(data.get("current"));
        return String.format(
                "%s: Tổng chi %s (ví + sổ tay).",
                label(data.get("currentLabel")),
                money(current.get("totalExpense")));
    }

    private String buildPeriodNet(Map<String, Object> data) {
        Map<String, Object> current = map(data.get("current"));
        double income = num(current.get("totalIncome"));
        double expense = num(current.get("totalExpense"));
        double net = num(current.get("net"));
        String conclusion;
        if (income > expense) {
            conclusion = "Thu nhiều hơn chi " + money(income - expense) + ".";
        } else if (expense > income) {
            conclusion = "Chi nhiều hơn thu " + money(expense - income) + ".";
        } else {
            conclusion = "Thu và chi bằng nhau.";
        }
        return String.format(
                "%s: Thu %s, chi %s, dòng tiền ròng %s. %s",
                label(data.get("currentLabel")),
                money(income),
                money(expense),
                money(net),
                conclusion);
    }

    private String buildSourceWallet(Map<String, Object> data) {
        Map<String, Object> wallet = flow(data, "current", "wallet");
        return String.format(
                "%s · Ví: Nạp %s, rút %s, ròng %s.",
                label(data.get("currentLabel")),
                money(wallet.get("income")),
                money(wallet.get("expense")),
                money(wallet.get("net")));
    }

    private String buildSourceCash(Map<String, Object> data) {
        Map<String, Object> cash = flow(data, "current", "cash");
        return String.format(
                "%s · Sổ tay: Thu %s, chi %s, ròng %s.",
                label(data.get("currentLabel")),
                money(cash.get("income")),
                money(cash.get("expense")),
                money(cash.get("net")));
    }

    private String buildSourceFund(Map<String, Object> data) {
        Map<String, Object> fund = flow(data, "current", "fund");
        return String.format(
                "%s · Quỹ: Nạp %s, rút %s, ròng %s. (Quỹ không tính vào tổng thu/chi ví+sổ tay.)",
                label(data.get("currentLabel")),
                money(fund.get("income")),
                money(fund.get("expense")),
                money(fund.get("net")));
    }

    private String buildCompareOverview(Map<String, Object> data) {
        Map<String, Object> current = map(data.get("current"));
        Map<String, Object> compare = map(data.get("compare"));
        return String.format(
                "%s: thu %s, chi %s, ròng %s.%n%s: thu %s, chi %s, ròng %s.",
                label(data.get("currentLabel")),
                money(current.get("totalIncome")),
                money(current.get("totalExpense")),
                money(current.get("net")),
                label(data.get("compareLabel")),
                money(compare.get("totalIncome")),
                money(compare.get("totalExpense")),
                money(compare.get("net")));
    }

    private String buildCompareIncome(Map<String, Object> data) {
        return compareField(data, "totalIncome", "Thu");
    }

    private String buildCompareExpense(Map<String, Object> data) {
        return compareField(data, "totalExpense", "Chi");
    }

    private String buildCompareNet(Map<String, Object> data) {
        return compareField(data, "net", "Ròng");
    }

    private String buildCompareWallet(Map<String, Object> data) {
        Map<String, Object> current = flow(data, "current", "wallet");
        Map<String, Object> compare = flow(data, "compare", "wallet");
        Map<String, Object> delta = map(map(data.get("delta")).get("wallet"));
        Map<String, Object> netDelta = map(delta.get("net"));
        return String.format(
                "Ví %s: nạp %s, rút %s. So %s: nạp %s, rút %s. Δ ròng ví: %s.",
                label(data.get("currentLabel")),
                money(current.get("income")),
                money(current.get("expense")),
                label(data.get("compareLabel")),
                money(compare.get("income")),
                money(compare.get("expense")),
                formatDelta(netDelta));
    }

    private String buildCompareCash(Map<String, Object> data) {
        Map<String, Object> current = flow(data, "current", "cash");
        Map<String, Object> compare = flow(data, "compare", "cash");
        Map<String, Object> delta = map(map(data.get("delta")).get("cash"));
        Map<String, Object> netDelta = map(delta.get("net"));
        return String.format(
                "Sổ tay %s: thu %s, chi %s. So %s: thu %s, chi %s. Δ ròng sổ tay: %s.",
                label(data.get("currentLabel")),
                money(current.get("income")),
                money(current.get("expense")),
                label(data.get("compareLabel")),
                money(compare.get("income")),
                money(compare.get("expense")),
                formatDelta(netDelta));
    }

    private String buildDeltaSummary(Map<String, Object> data) {
        Map<String, Object> delta = map(data.get("delta"));
        Map<String, Object> net = map(delta.get("net"));
        double amount = num(net.get("amount"));
        String direction = amount >= 0 ? "tăng" : "giảm";
        return String.format(
                "So với %s, dòng tiền ròng %s %s (%s). Thu Δ %s, chi Δ %s.",
                label(data.get("compareLabel")),
                direction,
                money(Math.abs(amount)),
                formatPercent(net.get("percent")),
                formatDelta(map(delta.get("totalIncome"))),
                formatDelta(map(delta.get("totalExpense"))));
    }

    private String compareField(Map<String, Object> data, String field, String fieldLabel) {
        Map<String, Object> current = map(data.get("current"));
        Map<String, Object> compare = map(data.get("compare"));
        Map<String, Object> delta = map(map(data.get("delta")).get(field));
        return String.format(
                "%s: %s %s. %s: %s. Chênh lệch: %s.",
                label(data.get("currentLabel")),
                fieldLabel,
                money(current.get(field)),
                label(data.get("compareLabel")),
                money(compare.get(field)),
                formatDelta(delta));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> map(Object obj) {
        if (obj instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> flow(Map<String, Object> data, String snapshotKey, String flowKey) {
        Map<String, Object> snapshot = map(data.get(snapshotKey));
        return map(snapshot.get(flowKey));
    }

    private AiCardItemDto item(String label, String value) {
        return AiCardItemDto.builder().label(label).value(value).build();
    }

    private AiActionDto navigate(String id, String label, String route) {
        return AiActionDto.builder()
                .id(id)
                .label(label)
                .type("NAVIGATE")
                .route(route)
                .build();
    }

    private String label(Object value) {
        return value != null ? value.toString() : "Kỳ hiện tại";
    }

    private String money(Object value) {
        return MONEY.format(Math.round(num(value))) + " đ";
    }

    private String percent(Object value) {
        return String.format("%.0f%%", num(value));
    }

    private double num(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return 0d;
    }

    private String deltaMoney(Map<String, Object> delta, String key) {
        Map<String, Object> field = map(delta.get(key));
        return formatDelta(field);
    }

    private String formatDelta(Map<String, Object> delta) {
        if (delta.isEmpty()) {
            return "0 đ";
        }
        double amount = num(delta.get("amount"));
        String sign = amount >= 0 ? "+" : "";
        return sign + money(amount) + " (" + formatPercent(delta.get("percent")) + ")";
    }

    private String formatPercent(Object percent) {
        if (percent == null) {
            return "—";
        }
        return String.format("%.1f%%", num(percent));
    }
}
