package com.project.app.ai.query;

import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.budget.dto.BudgetSourceSpend;
import com.project.app.budget.dto.response.BudgetResponse;
import com.project.app.budget.service.BudgetService;
import com.project.app.category.dto.response.CategoryItemResponse;
import com.project.app.category.service.CategoryService;
import com.project.app.fund.dto.response.FundDetailResponse;
import com.project.app.fund.dto.response.FundSummaryResponse;
import com.project.app.fund.dto.response.FundTransactionResponse;
import com.project.app.fund.service.FundService;
import com.project.app.history.dto.response.TransactionHistoryResponse;
import com.project.app.history.service.HistoryService;
import com.project.app.invoice.dto.response.InvoiceResponse;
import com.project.app.invoice.service.InvoiceService;
import com.project.app.notebook.enums.NotebookTransactionType;
import com.project.app.notebook.entity.NotebookTransaction;
import com.project.app.notebook.repository.NotebookTransactionRepository;
import com.project.app.splitbill.dto.response.SplitBillMemberResponse;
import com.project.app.splitbill.dto.response.SplitBillResponse;
import com.project.app.splitbill.service.SplitBillService;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.User;
import com.project.app.wallet.enums.WalletTransactionType;
import com.project.app.wallet.entity.WalletTransaction;
import com.project.app.wallet.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class DynamicDataQueryService {

    private static final Pattern TOP_LIMIT = Pattern.compile("(?:top|lay|xem)\\s*(\\d{1,2})");
    private static final Pattern QUOTED_NAME = Pattern.compile("[\\\"“”']\\s*([^\\\"“”']+?)\\s*[\\\"“”']");
    private static final Pattern BUDGET_NAME = Pattern.compile(
            "(?:ngan sach|han muc)\\s+(?:ten\\s+la\\s+)?(.+?)(?:\\s+(?:cua toi|toi|da|co|con|trong|thang|bi|vuot|chua|hien tai)\\b|[?.!,]|$)");
    private static final Pattern EXPENSE_CATEGORY_NAME = Pattern.compile(
            "(?:chi phi|chi tieu cho|da chi cho|tieu cho|chi cho)\\s+(.+?)(?:\\s+(?:cua toi|trong|tu|thang|tuan|nam|la|het|bao nhieu)\\b|[?.!,]|$)");
    private static final Pattern EXPENSE_AMOUNT_THEN_CATEGORY = Pattern.compile(
            "(?:ton|tieu|chi)(?:\\s+het)?\\s+bao nhieu\\s+(?:tien\\s+)?(.+?)(?:\\s+(?:trong|tu|thang|tuan|nam)\\b|[?.!,]|$)");
    private static final Pattern RECENT_MONTH_COUNT = Pattern.compile("(?:trong\\s+)?(\\d{1,2})\\s*thang(?:\\s+gan\\s+nhat|\\s+qua)?");

    private final CategoryService categoryService;
    private final TransactionRepository transactionRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final NotebookTransactionRepository notebookTransactionRepository;
    private final BudgetService budgetService;
    private final FundService fundService;
    private final InvoiceService invoiceService;
    private final HistoryService historyService;
    private final SplitBillService splitBillService;

    public record QueryAnswer(String text, String moduleType, ToolResultDto toolResult) {
    }

    private record ExpenseRow(String code, String label, BigDecimal amount, LocalDateTime createdAt, String source) {
    }

    private record WalletHistoryRow(String code, BigDecimal amount, LocalDateTime createdAt, String note, String source) {
    }

    public Optional<QueryAnswer> query(User user, String message) {
        if (user == null || user.getId() == null || message == null || message.isBlank()) return Optional.empty();
        String n = normalize(message);

        // Domain-specific nouns win over generic phrases such as "bao nhiêu".
        // Otherwise "còn bao nhiêu ngân sách cho Ăn uống" is mistaken for spending.
        if (isDynamicBudgetRequest(n))
            return Optional.of(dynamicBudgetAdvice(user, n));
        if (has(n, "ngan sach", "han muc") && has(n, "con bao nhieu", "vuot", "con lai", "da dung", "trang thai"))
            return Optional.of(budgetStatus(user, message));
        if (has(n, "toi uu", "toi uu hoa", "giam chi", "cat giam", "tiet che")
                && has(n, "chi tieu", "khoan chi", "chi phi"))
            return Optional.of(optimizeCategorySpending(user, message));
        if (has(n, "chi phi", "da tieu", "da chi", "tieu bao nhieu", "chi bao nhieu", "ton bao nhieu", "het bao nhieu")
                && (mentionsUserCategory(user, n) || extractExpenseCategoryName(message) != null))
            return Optional.of(categorySpending(user, message, n));
        if (has(n, "top", "khoan chi") && has(n, "lon nhat", "cao nhat", "nhieu nhat"))
            return Optional.of(topExpenses(user, n, parseTopLimit(n)));
        if (has(n, "hoa don") && has(n, "sap den han", "sap toi han", "gan den han", "den han trong", "can thanh toan",
                "phai thanh toan", "chua thanh toan", "chua tra", "dang cho", "pending"))
            return Optional.of(invoices(user, n));
        if (has(n, "chia tien", "khoan chia", "split bill") && has(n, "thanh toan", "da tra", "trang thai"))
            return Optional.of(splitBill(user, message));
        // Thuc the cu the (quy) phai duoc uu tien truoc dong tu chung "nap/rut tien".
        // Neu khong, "rut tien tu quy" se bi hieu nham thanh rut Vi ve ngan hang.
        if (has(n, "quy", "fund") && has(n, "dong gop", "gop bao nhieu", "nap vao quy", "nap tien vao", "ai da gop"))
            return Optional.of(fundContributions(user, message, n));
        if (has(n, "quy", "fund") && has(n, "giao dich rut", "lich su rut", "rut tien tu quy"))
            return Optional.of(fundTransactions(user, message, "WITHDRAW"));
        if (has(n, "quy", "fund") && has(n, "bao nhieu tien", "so du", "chi tiet"))
            return Optional.of(fundDetails(user, message));
        if (has(n, "giao dich", "lich su") && has(n, "nap tien", "nap vi", "rut tien", "rut ve ngan hang"))
            return Optional.of(walletTransactions(user, n));
        return Optional.empty();
    }

    static boolean isDynamicBudgetRequest(String normalized) {
        return hasStatic(normalized, "ngan sach", "han muc")
                && hasStatic(normalized, "phat sinh", "dam cuoi", "sinh nhat", "su kien", "dieu chinh linh hoat");
    }

    private QueryAnswer dynamicBudgetAdvice(User user, String normalizedQuestion) {
        List<BudgetResponse> active = budgetService.listBudgets(user.getId()).stream()
                .filter(budget -> budget.getStatus() == com.project.app.budget.enums.BudgetStatus.ACTIVE)
                .toList();
        List<String> names = active.stream().map(BudgetResponse::getCategoryName).filter(Objects::nonNull).toList();
        Optional<BudgetResponse> mentionedBudget = active.stream()
                .filter(budget -> budget.getCategoryName() != null
                        && normalizedQuestion.contains(normalize(budget.getCategoryName())))
                .findFirst();

        if (active.isEmpty()) {
            return answer("adjust_dynamic_budget", "RECOMMENDATION",
                    "Bạn chưa có ngân sách đang hoạt động nên chưa có khoản nào để điều chuyển. "
                            + "Hãy ước tính riêng chi phí đám cưới/sinh nhật, tạo danh mục phù hợp rồi lập ngân sách ngắn hạn cho tháng này; giữ thêm 5–10% dự phòng.",
                    Map.of("activeBudgets", List.of(), "activeCount", 0));
        }
        if (active.size() == 1) {
            if (mentionedBudget.isPresent()) {
                BudgetResponse budget = mentionedBudget.get();
                BigDecimal used = spent(budget);
                BigDecimal limit = nz(budget.getLimitAmount());
                BigDecimal remaining = limit.subtract(used).max(BigDecimal.ZERO);
                return answer("adjust_dynamic_budget", "RECOMMENDATION",
                        "Khoản phát sinh thuộc đúng ngân sách \"" + budget.getCategoryName() + "\" đang có. "
                                + "Hiện hạn mức là " + money(limit) + ", đã chi " + money(used)
                                + " và còn khoảng " + money(remaining) + ". "
                                + "Bạn nên cộng tổng chi \"" + budget.getCategoryName() + "\" dự kiến còn lại với 5–10% dự phòng rồi cập nhật hạn mức cho riêng tháng này; "
                                + "không cần tạo danh mục mới. Hãy cho tôi số tiền phát sinh dự kiến để tính hạn mức mới cụ thể.",
                        Map.of("activeBudgets", names, "activeCount", 1, "matchedBudget", budget.getCategoryName(),
                                "limit", limit, "spent", used, "remaining", remaining));
            }
            String onlyName = names.isEmpty() ? "hiện tại" : names.get(0);
            return answer("adjust_dynamic_budget", "RECOMMENDATION",
                    "Hiện bạn chỉ có một ngân sách đang hoạt động là \"" + onlyName + "\", vì vậy không có ngân sách khác để chuyển bớt. "
                            + "Không nên tự tăng hoặc giảm hạn mức này nếu các khoản phát sinh không thuộc danh mục đó. "
                            + "Hãy ước tính riêng từng sự kiện, tạo danh mục/ngân sách ngắn hạn tương ứng cho tháng này và giữ 5–10% dự phòng; "
                            + "nếu cho biết số tiền dự kiến, tôi có thể giúp chia cụ thể.",
                    Map.of("activeBudgets", names, "activeCount", 1));
        }

        return answer("adjust_dynamic_budget", "RECOMMENDATION",
                "Bạn đang có " + active.size() + " ngân sách hoạt động: " + String.join(", ", names) + ". "
                        + "Hãy giữ nguyên các khoản thiết yếu, chỉ giảm danh mục linh hoạt sau khi xem số còn lại; "
                        + "tạo ngân sách sự kiện ngắn hạn và chừa 5–10% dự phòng. Tôi chưa tự điều chuyển hạn mức khi bạn chưa nêu số tiền dự kiến.",
                Map.of("activeBudgets", names, "activeCount", active.size()));
    }

    private QueryAnswer optimizeCategorySpending(User user, String raw) {
        List<CategoryItemResponse> categories = categoryService.getCategoriesForUser(user.getId()).stream()
                .flatMap(group -> group.getItems().stream()).toList();
        List<String> requestedNames = extractQuotedNames(raw);
        if (requestedNames.isEmpty()) {
            requestedNames = categories.stream().filter(category -> normalize(raw).contains(normalize(category.getLabel())))
                    .map(CategoryItemResponse::getLabel).distinct().toList();
        }
        if (requestedNames.isEmpty()) {
            return answer("analyze_spending_trend", "FINANCE",
                    "Bạn muốn tối ưu khoản nào? Hãy nêu một hoặc vài danh mục, ví dụ: “Tối ưu Ăn uống và Mua sắm”.",
                    Map.of("availableCategories", categories.stream().map(CategoryItemResponse::getLabel).toList()));
        }

        LocalDate today = LocalDate.now();
        LocalDateTime from = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime to = today.plusDays(1).atStartOfDay();
        List<Map<String, Object>> results = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        for (String requestedName : requestedNames) {
            Optional<CategoryItemResponse> match = categories.stream()
                    .filter(category -> categoryNameEquivalent(requestedName, category.getLabel()))
                    .findFirst();
            if (match.isEmpty()) {
                missing.add(requestedName);
                continue;
            }
            CategoryItemResponse category = match.get();
            BigDecimal wallet = nz(walletTransactionRepository.sumAmountByUserAndTypeAndCategoryAndCreatedAtRange(
                    user.getId(), WalletTransactionType.WITHDRAW, category.getId(), from, to));
            wallet = wallet.add(nz(transactionRepository.sumOrphanAmountByUserAndTypesAndStatusAndCategoryAndCreatedAtRange(
                    user.getId(), expenseTypes(), TransactionStatus.SUCCESS, category.getId(), from, to)));
            BigDecimal notebook = nz(notebookTransactionRepository.sumAmountByUserAndTypeAndCategoryAndCreatedAtRange(
                    user.getId(), NotebookTransactionType.EXPENSE, category.getId(), from, to));
            results.add(Map.of("categoryId", category.getId(), "categoryName", category.getLabel(),
                    "amount", wallet.add(notebook), "walletAmount", wallet, "notebookAmount", notebook));
        }

        if (results.isEmpty()) {
            return answer("analyze_spending_trend", "FINANCE",
                    "Bạn chưa có " + nounList(missing) + " trong danh mục hiện tại. Danh mục đang có: "
                            + categories.stream().map(CategoryItemResponse::getLabel).collect(Collectors.joining(", ")) + ".",
                    Map.of("missingCategories", missing, "categories", List.of()));
        }

        results.sort((left, right) -> ((BigDecimal) right.get("amount")).compareTo((BigDecimal) left.get("amount")));
        String amounts = results.stream().map(row -> row.get("categoryName") + " — " + money((BigDecimal) row.get("amount")))
                .collect(Collectors.joining("; "));
        String missingText = missing.isEmpty() ? "" : " Chưa có danh mục: " + String.join(", ", missing) + ".";
        String advice = results.size() > 1
                ? " Hãy ưu tiên đặt hạn mức cho khoản có số chi cao hơn, theo dõi theo tuần và giảm các chuyến không cần thiết hoặc kết hợp lộ trình."
                : " Hãy đặt hạn mức theo tuần và theo dõi các giao dịch lớn để tìm phần có thể cắt giảm.";
        return answer("analyze_spending_trend", "FINANCE",
                "Chi tiêu tháng này: " + amounts + "." + missingText + advice,
                Map.of("categories", results, "missingCategories", missing));
    }

    static List<String> extractQuotedNames(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        List<String> names = new ArrayList<>();
        Matcher matcher = QUOTED_NAME.matcher(raw);
        while (matcher.find()) {
            String name = matcher.group(1).trim();
            if (looksLikeShortCategoryName(name)) names.add(name);
        }
        return names.stream().distinct().toList();
    }

    private boolean categoryNameEquivalent(String requested, String actual) {
        String left = normalize(requested), right = normalize(actual);
        return left.equals(right) || editDistance(left, right) <= Math.max(1, Math.max(left.length(), right.length()) / 6);
    }

    private String nounList(List<String> names) {
        return names.size() == 1 ? "danh mục \"" + names.get(0) + "\""
                : "các danh mục \"" + String.join("\", \"", names) + "\"";
    }

    private QueryAnswer categorySpending(User user, String raw, String normalized) {
        List<CategoryItemResponse> categories = categoryService.getCategoriesForUser(user.getId()).stream()
                .flatMap(group -> group.getItems().stream()).toList();
        Optional<CategoryItemResponse> requested = findMentionedCategory(normalized, categories);

        LocalDate today = LocalDate.now();
        LocalDate start;
        LocalDate endExclusive;
        String period;
        int recentMonths = parseRecentMonthCount(normalized);
        if (recentMonths > 1) {
            start = today.minusMonths(recentMonths - 1L).withDayOfMonth(1);
            endExclusive = today.plusDays(1);
            period = recentMonths + " tháng gần nhất";
        } else if (has(normalized, "ba thang", "ba tháng")) {
            start = today.minusMonths(2).withDayOfMonth(1);
            endExclusive = today.plusDays(1);
            period = "3 tháng gần nhất";
        } else if (normalized.contains("tuan")) {
            start = today.with(java.time.DayOfWeek.MONDAY);
            endExclusive = today.plusDays(1);
            period = "tuần này";
        } else {
            start = today.withDayOfMonth(1);
            endExclusive = today.plusDays(1);
            period = "tháng này";
        }

        if (requested.isEmpty()) {
            String requestedName = extractExpenseCategoryName(raw);
            if (requestedName == null || requestedName.isBlank()) {
                return answer("get_spending_by_category", "FINANCE",
                        "Tôi chưa xác định được tên khoản chi trong câu hỏi. Bạn có thể ghi rõ, ví dụ: “3 tháng gần nhất tôi chi bao nhiêu cho Xăng xe?”.",
                        Map.of("availableCategories", categories.stream().map(CategoryItemResponse::getLabel).toList()));
            }
            List<String> available = categories.stream().map(CategoryItemResponse::getLabel).distinct().toList();
            String suffix = available.isEmpty()
                    ? "Bạn hiện chưa tạo danh mục chi tiêu nào."
                    : "Danh mục hiện có của bạn: " + String.join(", ", available) + ".";
            return answer("get_spending_by_category", "FINANCE",
                    "Bạn chưa có danh mục \"" + requestedName + "\". " + suffix
                            + " Hãy tạo danh mục này và gắn vào giao dịch trước khi yêu cầu thống kê theo danh mục.",
                    Map.of("categoryName", requestedName, "categoryExists", false,
                            "availableCategories", available, "from", start, "to", endExclusive));
        }

        CategoryItemResponse category = requested.get();
        LocalDateTime from = start.atStartOfDay();
        LocalDateTime to = endExclusive.atStartOfDay();
        BigDecimal walletAmount = nz(walletTransactionRepository
                .sumAmountByUserAndTypeAndCategoryAndCreatedAtRange(
                        user.getId(), WalletTransactionType.WITHDRAW, category.getId(), from, to));
        BigDecimal legacyWalletAmount = nz(transactionRepository
                .sumOrphanAmountByUserAndTypesAndStatusAndCategoryAndCreatedAtRange(
                        user.getId(), expenseTypes(), TransactionStatus.SUCCESS, category.getId(), from, to));
        walletAmount = walletAmount.add(legacyWalletAmount);
        BigDecimal notebookAmount = nz(notebookTransactionRepository
                .sumAmountByUserAndTypeAndCategoryAndCreatedAtRange(
                        user.getId(), NotebookTransactionType.EXPENSE, category.getId(), from, to));
        BigDecimal amount = walletAmount.add(notebookAmount);

        String sourceDetail = walletAmount.signum() > 0 && notebookAmount.signum() > 0
                ? " (Ví " + money(walletAmount) + " + Sổ tay " + money(notebookAmount) + ")"
                : notebookAmount.signum() > 0 ? " trong Sổ tay" : walletAmount.signum() > 0 ? " trong Ví" : "";
        return answer("get_spending_by_category", "FINANCE",
                amount.signum() == 0
                        ? "Tôi tìm thấy danh mục \"" + category.getLabel() + "\", nhưng chưa ghi nhận khoản chi nào trong " + period + "."
                        : "Bạn đã chi " + money(amount) + " cho \"" + category.getLabel() + "\" trong " + period + sourceDetail + ".",
                Map.of("categoryId", category.getId(), "categoryName", category.getLabel(), "amount", amount,
                        "walletAmount", walletAmount, "notebookAmount", notebookAmount, "from", start, "to", today));
    }

    static String extractExpenseCategoryName(String raw) {
        if (raw == null || raw.isBlank()) return null;
        Matcher quoted = QUOTED_NAME.matcher(raw);
        if (quoted.find() && looksLikeShortCategoryName(quoted.group(1))) return quoted.group(1).trim();
        String normalized = normalize(raw);
        Matcher matcher = EXPENSE_CATEGORY_NAME.matcher(normalized);
        if (matcher.find()) return matcher.group(1).trim();
        Matcher reversed = EXPENSE_AMOUNT_THEN_CATEGORY.matcher(normalized);
        return reversed.find() ? reversed.group(1).trim() : null;
    }

    private static boolean looksLikeShortCategoryName(String value) {
        String normalized = normalize(value);
        return !normalized.isBlank() && normalized.split(" ").length <= 5
                && !hasStatic(normalized, "bao nhieu", "thang qua", "tuan qua", "toi da", "toi ton", "toi chi", "toi tieu");
    }

    static int parseRecentMonthCount(String normalized) {
        Matcher matcher = RECENT_MONTH_COUNT.matcher(normalized == null ? "" : normalized);
        if (!matcher.find()) return 0;
        return Math.max(1, Math.min(24, Integer.parseInt(matcher.group(1))));
    }

    private Optional<CategoryItemResponse> findMentionedCategory(
            String normalizedMessage,
            List<CategoryItemResponse> categories) {
        Optional<CategoryItemResponse> exact = categories.stream()
                .filter(category -> (" " + normalizedMessage + " ")
                        .contains(" " + normalize(category.getLabel()) + " "))
                .max(Comparator.comparingInt(category -> normalize(category.getLabel()).length()));
        if (exact.isPresent()) return exact;

        String[] words = normalizedMessage.split(" ");
        CategoryItemResponse best = null;
        int bestDistance = Integer.MAX_VALUE;
        for (CategoryItemResponse category : categories) {
            String label = normalize(category.getLabel());
            int labelWords = Math.max(1, label.split(" ").length);
            for (int i = 0; i + labelWords <= words.length; i++) {
                String candidate = String.join(" ", Arrays.copyOfRange(words, i, i + labelWords));
                int distance = editDistance(label, candidate);
                int tolerance = Math.max(1, label.length() / 5);
                if (distance <= tolerance && distance < bestDistance) {
                    best = category;
                    bestDistance = distance;
                }
            }
        }
        return Optional.ofNullable(best);
    }

    private boolean mentionsUserCategory(User user, String normalizedMessage) {
        List<CategoryItemResponse> categories = categoryService.getCategoriesForUser(user.getId()).stream()
                .flatMap(group -> group.getItems().stream()).toList();
        return findMentionedCategory(normalizedMessage, categories).isPresent();
    }

    private int editDistance(String left, String right) {
        int[] previous = new int[right.length() + 1];
        for (int j = 0; j <= right.length(); j++) previous[j] = j;
        for (int i = 1; i <= left.length(); i++) {
            int[] current = new int[right.length() + 1];
            current[0] = i;
            for (int j = 1; j <= right.length(); j++) {
                int replace = previous[j - 1] + (left.charAt(i - 1) == right.charAt(j - 1) ? 0 : 1);
                current[j] = Math.min(Math.min(previous[j] + 1, current[j - 1] + 1), replace);
            }
            previous = current;
        }
        return previous[right.length()];
    }

    private List<TransactionType> expenseTypes() {
        return List.of(TransactionType.WITHDRAW, TransactionType.TRANSFER, TransactionType.PAYMENT,
                TransactionType.BANK_LINK_FEE, TransactionType.EXPENSE);
    }

    private QueryAnswer topExpenses(User user, String normalized, int limit) {
        DateWindow window = resolveDateWindow(normalized);
        LocalDateTime from = window.from().atStartOfDay();
        LocalDateTime to = window.toExclusive().atStartOfDay();
        List<WalletTransaction> walletRows = walletTransactionRepository.findAllByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(t -> t.getType() == WalletTransactionType.WITHDRAW)
                .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().isBefore(from) && t.getCreatedAt().isBefore(to))
                .filter(t -> !isInternalFundTransfer(t.getTransactionCode(), t.getCategoryName()))
                .toList();
        Set<String> walletCodes = walletRows.stream().map(WalletTransaction::getTransactionCode).collect(Collectors.toSet());

        List<ExpenseRow> allRows = new ArrayList<>();
        walletRows.forEach(t -> allRows.add(new ExpenseRow(t.getTransactionCode(),
                firstNonBlank(t.getCategoryName(), t.getNote(), "Rút tiền"), t.getAmount(), t.getCreatedAt(), "Ví")));

        List<NotebookTransaction> notebookRows = notebookTransactionRepository
                .findAllByUserIdAndTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
                        user.getId(), NotebookTransactionType.EXPENSE, from, to);
        notebookRows.forEach(t -> allRows.add(new ExpenseRow(t.getTransactionCode(),
                firstNonBlank(t.getCategoryName(), t.getNote(), "Chi Sổ tay"), t.getAmount(), t.getCreatedAt(), "Sổ tay")));

        historyService.getTransactionHistory(user).stream()
                .filter(t -> expenseTypes().contains(t.getType()))
                .filter(t -> t.getStatus() == TransactionStatus.SUCCESS)
                .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().isBefore(from) && t.getCreatedAt().isBefore(to))
                .filter(t -> !walletCodes.contains(t.getTransactionCode()))
                .filter(t -> !isInternalFundTransfer(t.getTransactionCode(), t.getCategoryLabel()))
                .forEach(t -> allRows.add(new ExpenseRow(t.getTransactionCode(),
                        firstNonBlank(t.getCategoryLabel(), t.getNote(), "Khoản chi"), t.getAmount(), t.getCreatedAt(), "Dữ liệu cũ")));

        allRows.sort(Comparator.comparing(ExpenseRow::amount, Comparator.nullsLast(Comparator.reverseOrder())));
        List<ExpenseRow> rows = allRows.stream().limit(limit).toList();
        if (rows.isEmpty()) return answer("get_top_expenses", "FINANCE", window.label() + " bạn chưa có khoản chi nào.", Map.of("transactions", List.of(), "limit", limit));
        String prefix = rows.size() < limit
                ? "Bạn yêu cầu Top " + limit + ", nhưng " + window.label().toLowerCase(Locale.ROOT)
                        + " chỉ có " + rows.size() + " khoản chi hợp lệ: "
                : "Top " + limit + " khoản chi " + window.label().toLowerCase(Locale.ROOT) + ": ";
        StringJoiner text = new StringJoiner("; ", prefix, ".");
        List<Map<String, Object>> payload = new ArrayList<>();
        for (ExpenseRow row : rows) {
            text.add(row.label() + " — " + money(row.amount()) + " (" + row.source() + ")");
            payload.add(Map.of("code", row.code(), "category", row.label(), "amount", row.amount(),
                    "createdAt", row.createdAt(), "source", row.source()));
        }
        return answer("get_top_expenses", "FINANCE", text.toString(), Map.of(
                "transactions", payload, "requestedLimit", limit, "returnedCount", rows.size()));
    }

    private int parseTopLimit(String normalized) {
        String latest = normalized.contains("cau hoi noi tiep")
                ? normalized.substring(normalized.lastIndexOf("cau hoi noi tiep"))
                : normalized;
        Matcher matcher = TOP_LIMIT.matcher(latest);
        int parsed = 3;
        while (matcher.find()) parsed = Integer.parseInt(matcher.group(1));
        if (!TOP_LIMIT.matcher(latest).find()) {
            if (has(latest, "top mot", "mot khoan")) parsed = 1;
            else if (has(latest, "top hai", "hai khoan")) parsed = 2;
            else if (has(latest, "top ba", "ba khoan")) parsed = 3;
            else if (has(latest, "top nam", "nam khoan")) parsed = 5;
        }
        return Math.max(1, Math.min(parsed, 20));
    }

    private DateWindow resolveDateWindow(String normalized) {
        LocalDate today = LocalDate.now();
        if (normalized.contains("tuan truoc")) {
            LocalDate start = today.minusWeeks(1).with(java.time.DayOfWeek.MONDAY);
            return new DateWindow(start, start.plusWeeks(1), "Tuần trước");
        }
        if (normalized.contains("tuan nay")) {
            LocalDate start = today.with(java.time.DayOfWeek.MONDAY);
            return new DateWindow(start, today.plusDays(1), "Tuần này");
        }
        if (normalized.contains("thang truoc")) {
            YearMonth month = YearMonth.now().minusMonths(1);
            return new DateWindow(month.atDay(1), month.plusMonths(1).atDay(1), "Tháng trước");
        }
        if (normalized.contains("nam nay")) {
            return new DateWindow(today.withDayOfYear(1), today.plusDays(1), "Năm nay");
        }
        YearMonth month = YearMonth.now();
        return new DateWindow(month.atDay(1), today.plusDays(1), "Tháng này");
    }

    private boolean isInternalFundTransfer(String code, String categoryName) {
        return (code != null && (code.startsWith("FDEP") || code.startsWith("FWD")))
                || (categoryName != null && has(normalize(categoryName), "nap quy", "rut quy"));
    }

    private record DateWindow(LocalDate from, LocalDate toExclusive, String label) {
    }

    private QueryAnswer budgetStatus(User user, String raw) {
        String n = normalize(raw);
        List<CategoryItemResponse> categories = categoryService.getCategoriesForUser(user.getId()).stream()
                .flatMap(group -> group.getItems().stream()).toList();
        Optional<CategoryItemResponse> mentionedCategory = findMentionedCategory(n, categories);
        LocalDate today = LocalDate.now();
        List<BudgetResponse> activeBudgets = budgetService.listBudgets(user.getId()).stream()
                .filter(b -> b.getStartDate() == null || !b.getStartDate().isAfter(today))
                .filter(b -> b.getEndDate() == null || !b.getEndDate().isBefore(today))
                .toList();
        Optional<BudgetResponse> match = activeBudgets.stream()
                .filter(b -> mentionedCategory
                        .map(category -> Objects.equals(category.getId(), b.getCategoryId()))
                        .orElseGet(() -> b.getCategoryName() != null
                                && (" " + n + " ").contains(" " + normalize(b.getCategoryName()) + " ")))
                .findFirst();
        if (match.isEmpty()) {
            String requestedName = mentionedCategory.map(CategoryItemResponse::getLabel)
                    .orElseGet(() -> extractBudgetName(raw));
            List<String> existingNames = activeBudgets.stream().map(BudgetResponse::getCategoryName)
                    .filter(Objects::nonNull).distinct().toList();
            if (mentionedCategory.isEmpty()) {
                String subject = requestedName == null || requestedName.isBlank()
                        ? "ngân sách bạn hỏi" : "ngân sách \"" + requestedName + "\"";
                String existing = existingNames.isEmpty()
                        ? "Bạn hiện chưa có ngân sách nào đang áp dụng."
                        : "Ngân sách đang áp dụng của bạn: " + String.join(", ", existingNames) + ".";
                return answer("get_budget_status", "BUDGET",
                        "Không tìm thấy " + subject + ". " + existing,
                        Map.of("requestedName", requestedName == null ? "" : requestedName,
                                "budgetExists", false, "availableBudgets", existingNames));
            }
            String categoryName = mentionedCategory.get().getLabel();
            return answer("get_budget_status", "BUDGET",
                    "Bạn đã có danh mục \"" + categoryName + "\", nhưng chưa tạo ngân sách đang áp dụng cho danh mục này. "
                            + "Khoản chi đã ghi nhận không tự tạo thành ngân sách. "
                            + (existingNames.isEmpty() ? "" : "Ngân sách hiện có: " + String.join(", ", existingNames) + ". ")
                            + "Bạn có thể vào Ngân sách → Tạo ngân sách nếu muốn đặt hạn mức.",
                    Map.of("categoryName", categoryName, "budgetExists", false, "availableBudgets", existingNames));
        }
        BudgetResponse b = match.get();
        BigDecimal spent = spent(b);
        BigDecimal remaining = nz(b.getLimitAmount()).subtract(spent);
        boolean over = remaining.signum() < 0;
        String text = over
                ? "Ngân sách \"" + b.getCategoryName() + "\" đã vượt " + money(remaining.abs()) + "."
                : "Ngân sách \"" + b.getCategoryName() + "\" còn " + money(remaining) + ".";
        return answer("get_budget_status", "BUDGET", text, Map.of("categoryName", b.getCategoryName(), "limit", b.getLimitAmount(), "spent", spent, "remaining", remaining, "overLimit", over));
    }

    static String extractBudgetName(String raw) {
        if (raw == null || raw.isBlank()) return null;
        Matcher quoted = QUOTED_NAME.matcher(raw);
        if (quoted.find()) return quoted.group(1).trim();
        Matcher matcher = BUDGET_NAME.matcher(normalize(raw));
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    private QueryAnswer invoices(User user, String n) {
        LocalDate today = LocalDate.now();
        List<InvoiceResponse> pending = invoiceService.getInvoices(user).stream().filter(i -> !i.isPaid()).toList();
        List<InvoiceResponse> selected = has(n, "sap den han", "gan den han")
                ? pending.stream().filter(i -> i.getDueDate() != null && !i.getDueDate().isBefore(today) && !i.getDueDate().isAfter(today.plusDays(7))).toList()
                : pending;
        if (has(n, "dien", "nuoc")) {
            selected = selected.stream()
                    .filter(i -> i.getInvoiceName() != null && (normalize(i.getInvoiceName()).contains("dien") || normalize(i.getInvoiceName()).contains("nuoc")))
                    .toList();
        }
        String tool = has(n, "sap den han", "gan den han") ? "get_upcoming_invoices" : "get_pending_invoices";
        if (selected.isEmpty()) return answer(tool, "RAG", "Bạn không có hóa đơn phù hợp đang chờ thanh toán.", Map.of("invoices", List.of(), "count", 0));
        StringJoiner joiner = new StringJoiner("; ", "Các hóa đơn: ", ".");
        selected.forEach(i -> joiner.add(i.getInvoiceName() + " — " + money(i.getAmount()) + ", hạn " + i.getDueDate()));
        return answer(tool, "RAG", joiner.toString(), Map.of("count", selected.size(), "invoices", selected));
    }

    private QueryAnswer walletTransactions(User user, String n) {
        TransactionType type = has(n, "rut tien", "rut ve") ? TransactionType.WITHDRAW : TransactionType.TOP_UP;
        LocalDate start = n.contains("tuan qua") ? LocalDate.now().minusWeeks(1).with(java.time.DayOfWeek.MONDAY) : LocalDate.MIN;
        LocalDate end = n.contains("tuan qua") ? start.plusDays(6) : LocalDate.MAX;
        WalletTransactionType walletType = type == TransactionType.WITHDRAW
                ? WalletTransactionType.WITHDRAW : WalletTransactionType.TOP_UP;

        List<WalletHistoryRow> rows = new ArrayList<>();
        Set<String> codes = new HashSet<>();
        walletTransactionRepository.findAllByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(t -> t.getType() == walletType && inRange(t.getCreatedAt(), start, end))
                .filter(t -> !isInternalFundTransfer(t.getTransactionCode(), t.getCategoryName()))
                .forEach(t -> {
                    rows.add(new WalletHistoryRow(t.getTransactionCode(), t.getAmount(), t.getCreatedAt(),
                            firstNonBlank(t.getNote(), t.getCategoryName(), type == TransactionType.WITHDRAW ? "Rút về ngân hàng" : "Nạp tiền"), "Ví"));
                    if (t.getTransactionCode() != null) codes.add(t.getTransactionCode());
                });

        historyService.getTransactionHistory(user).stream()
                .filter(t -> t.getType() == type && t.getStatus() == TransactionStatus.SUCCESS)
                .filter(t -> inRange(t.getCreatedAt(), start, end))
                .filter(t -> t.getTransactionCode() == null || !codes.contains(t.getTransactionCode()))
                .filter(t -> !isInternalFundTransfer(t.getTransactionCode(), t.getCategoryLabel()))
                .forEach(t -> rows.add(new WalletHistoryRow(t.getTransactionCode(), t.getAmount(), t.getCreatedAt(),
                        firstNonBlank(t.getNote(), t.getCategoryLabel(), type == TransactionType.WITHDRAW ? "Rút về ngân hàng" : "Nạp tiền"), "Dữ liệu cũ")));

        rows.sort(Comparator.comparing(WalletHistoryRow::createdAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        if (rows.isEmpty()) return answer("get_transactions_by_type", "FINANCE", "Không tìm thấy giao dịch " + (type == TransactionType.WITHDRAW ? "rút tiền" : "nạp tiền") + " trong kỳ được hỏi.", Map.of("transactions", List.of()));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
        StringJoiner joiner = new StringJoiner("; ",
                "Có " + rows.size() + " giao dịch " + (type == TransactionType.WITHDRAW ? "rút tiền" : "nạp tiền") + ": ", ".");
        List<Map<String, Object>> payload = new ArrayList<>();
        rows.stream().limit(10).forEach(t -> {
            joiner.add(money(t.amount()) + " lúc " + (t.createdAt() == null ? "không rõ thời gian" : t.createdAt().format(formatter)));
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("code", t.code()); item.put("amount", t.amount()); item.put("createdAt", t.createdAt());
            item.put("note", t.note()); item.put("source", t.source()); payload.add(item);
        });
        return answer("get_transactions_by_type", "FINANCE", joiner.toString(),
                Map.of("type", type.name(), "count", rows.size(), "transactions", payload));
    }

    private QueryAnswer fundDetails(User user, String raw) {
        Optional<FundSummaryResponse> fund = findFund(user, raw);
        if (fund.isEmpty()) return answer("get_fund_details", "RAG", "Không tìm thấy quỹ được hỏi trong các quỹ bạn đang tham gia.", Map.of());
        FundSummaryResponse f = fund.get();
        return answer("get_fund_details", "RAG", "Quỹ \"" + f.getName() + "\" hiện có " + money(f.getBalance()) + ", mục tiêu " + money(f.getTargetAmount()) + ".", Map.of("fund", f));
    }

    private QueryAnswer fundContributions(User user, String raw, String n) {
        Optional<FundSummaryResponse> summary = findFund(user, raw);
        if (summary.isEmpty()) return answer("get_fund_contributions", "RAG", "Không tìm thấy quỹ được hỏi.", Map.of());
        FundDetailResponse detail = fundService.getFundDetail(user, summary.get().getId());
        boolean hasPeriod = has(n, "hom nay", "tuan nay", "tuan truoc", "tuan qua", "thang nay", "thang truoc", "nam nay");
        DateWindow window = hasPeriod ? resolveDateWindow(n) : new DateWindow(LocalDate.MIN, LocalDate.MAX, "Toàn bộ thời gian");
        boolean collective = isCollectiveContributionQuery(n);
        List<FundTransactionResponse> deposits = detail.getTransactions().stream()
                .filter(t -> "DEPOSIT".equalsIgnoreCase(t.getType()))
                .filter(t -> collective || user.getId().equals(t.getUserId()))
                .filter(t -> t.getCreatedAt() != null
                        && !t.getCreatedAt().toLocalDate().isBefore(window.from())
                        && t.getCreatedAt().toLocalDate().isBefore(window.toExclusive()))
                .toList();
        BigDecimal total = deposits.stream().map(FundTransactionResponse::getAmount)
                .map(this::nz).reduce(BigDecimal.ZERO, BigDecimal::add);

        if (!collective) {
            return answer("get_fund_contributions", "RAG",
                    "Bạn đã đóng góp " + money(total) + " vào quỹ \"" + detail.getName() + "\" trong "
                            + window.label().toLowerCase(Locale.ROOT) + ".",
                    Map.of("fundId", detail.getId(), "amount", total, "scope", "USER", "transactions", deposits));
        }

        Map<Long, List<FundTransactionResponse>> byUser = deposits.stream()
                .collect(Collectors.groupingBy(FundTransactionResponse::getUserId, LinkedHashMap::new, Collectors.toList()));
        List<Map<String, Object>> contributors = new ArrayList<>();
        StringJoiner names = new StringJoiner("; ");
        byUser.values().forEach(items -> {
            FundTransactionResponse first = items.get(0);
            BigDecimal amount = items.stream().map(FundTransactionResponse::getAmount)
                    .map(this::nz).reduce(BigDecimal.ZERO, BigDecimal::add);
            String name = first.getUserName() == null || first.getUserName().isBlank() ? "Thành viên" : first.getUserName();
            names.add(name + " — " + money(amount));
            contributors.add(Map.of("userId", first.getUserId(), "userName", name,
                    "amount", amount, "transactionCount", items.size()));
        });
        String text = deposits.isEmpty()
                ? "Chưa có thành viên nào đóng góp vào quỹ \"" + detail.getName() + "\" trong " + window.label().toLowerCase(Locale.ROOT) + "."
                : "Trong " + window.label().toLowerCase(Locale.ROOT) + ", quỹ \"" + detail.getName()
                        + "\" nhận tổng cộng " + money(total) + " từ " + byUser.size() + " người: " + names + ".";
        return answer("get_fund_contributions", "RAG", text,
                Map.of("fundId", detail.getId(), "amount", total, "scope", "ALL_MEMBERS",
                        "contributorCount", byUser.size(), "contributors", contributors, "transactions", deposits));
    }

    static boolean isCollectiveContributionQuery(String normalized) {
        boolean asksPeople = hasStatic(normalized, "nhung ai", "ai da", "ai gop", "cac thanh vien",
                "thanh vien nao", "ca nhom", "toan bo thanh vien", "moi nguoi");
        boolean explicitlyPersonal = hasStatic(normalized, "toi da", "toi gop", "toi dong gop", "cua toi");
        boolean asksFundTotal = hasStatic(normalized, "quy nhan", "tong quy", "tong tien vao quy", "tat ca da gop");
        return asksPeople || (asksFundTotal && !explicitlyPersonal);
    }

    private QueryAnswer fundTransactions(User user, String raw, String type) {
        Optional<FundSummaryResponse> summary = findFund(user, raw);
        if (summary.isEmpty()) return answer("get_fund_transactions", "RAG", "Không tìm thấy quỹ được hỏi.", Map.of());
        FundDetailResponse detail = fundService.getFundDetail(user, summary.get().getId());
        List<FundTransactionResponse> rows = detail.getTransactions().stream().filter(t -> type.equalsIgnoreCase(t.getType())).toList();
        if (rows.isEmpty()) return answer("get_fund_transactions", "RAG", "Quỹ \"" + detail.getName() + "\" chưa có giao dịch rút tiền.", Map.of("transactions", List.of()));
        StringJoiner joiner = new StringJoiner("; ", "Giao dịch rút quỹ: ", ".");
        rows.forEach(t -> joiner.add(money(t.getAmount()) + " bởi " + t.getUserName() + " lúc " + t.getCreatedAt()));
        return answer("get_fund_transactions", "RAG", joiner.toString(), Map.of("transactions", rows));
    }

    private QueryAnswer splitBill(User user, String raw) {
        String n = normalize(raw);
        Optional<SplitBillResponse> match = splitBillService.getMySplitBills(user).stream()
                .filter(b -> b.getTitle() != null && n.contains(normalize(b.getTitle()))).findFirst();
        if (match.isEmpty()) return answer("get_split_bill_status", "RAG", "Không tìm thấy khoản chia tiền được hỏi.", Map.of());
        SplitBillResponse bill = match.get();
        String members = bill.getMembers().stream().map(m -> m.getUsername() + ": " + memberStatus(m)).reduce((a, b) -> a + "; " + b).orElse("chưa có thành viên");
        return answer("get_split_bill_status", "RAG", "Khoản chia \"" + bill.getTitle() + "\": " + members + ".", Map.of("bill", bill));
    }

    private Optional<FundSummaryResponse> findFund(User user, String raw) {
        String n = normalize(raw);
        return fundService.listMyFunds(user).stream().filter(f -> f.getName() != null && n.contains(normalize(f.getName()))).findFirst();
    }

    private String memberStatus(SplitBillMemberResponse m) { return "PAID".equalsIgnoreCase(m.getStatus()) ? "đã thanh toán" : "chưa thanh toán"; }
    private String firstNonBlank(String... values) { return Arrays.stream(values).filter(Objects::nonNull).filter(v -> !v.isBlank()).findFirst().orElse("Khoản chi"); }
    private BigDecimal spent(BudgetResponse b) {
        return b.getTotal() != null ? source(b.getTotal()) : source(b.getNotebook()).add(source(b.getWallet()));
    }
    private BigDecimal source(BudgetSourceSpend s) { return s == null ? BigDecimal.ZERO : nz(s.getSpent()); }
    private BigDecimal nz(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
    private boolean inRange(LocalDateTime date, LocalDate start, LocalDate end) { return date != null && !date.toLocalDate().isBefore(start) && !date.toLocalDate().isAfter(end); }
    private String money(BigDecimal value) { return String.format("%,.0f ₫", nz(value)).replace(',', '.'); }
    private boolean has(String text, String... values) { return Arrays.stream(values).anyMatch(text::contains); }
    private static boolean hasStatic(String text, String... values) { return text != null && Arrays.stream(values).anyMatch(text::contains); }
    private static String normalize(String value) { return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD).replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT).replace('đ', 'd').replaceAll("[^a-z0-9]+", " ").trim(); }

    private QueryAnswer answer(String toolName, String module, String text, Map<String, ?> payload) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.putAll(payload);
        ToolResultDto result = ToolResultDto.builder().toolName(toolName).success(true).message(text).data(data).build();
        return new QueryAnswer(text, module, result);
    }
}
