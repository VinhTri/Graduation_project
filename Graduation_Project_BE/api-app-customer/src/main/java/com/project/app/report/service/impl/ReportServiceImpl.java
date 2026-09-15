package com.project.app.report.service.impl;

import com.project.app.category.entity.CategoryGroup;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryGroupRepository;
import com.project.app.category.repository.CategoryItemRepository;
import com.project.app.budget.dto.BudgetSourceSpend;
import com.project.app.budget.dto.response.BudgetResponse;
import com.project.app.budget.enums.BudgetStatus;
import com.project.app.budget.service.BudgetService;
import com.project.app.notebook.entity.NotebookBook;
import com.project.app.notebook.enums.NotebookBookType;
import com.project.app.notebook.enums.NotebookTransactionType;
import com.project.app.notebook.repository.NotebookBookRepository;
import com.project.app.notebook.repository.NotebookTransactionRepository;
import com.project.app.report.dto.response.FinanceCenterResponse;
import com.project.app.report.dto.response.ReportDistributionResponse;
import com.project.app.report.dto.response.ReportTrendResponse;
import com.project.app.report.service.ReportService;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.User;
import com.project.app.fund.enums.FundTransactionType;
import com.project.app.fund.repository.FundTransactionRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.enums.WalletTransactionType;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final TransactionRepository transactionRepository;
    private final CategoryItemRepository categoryItemRepository;
    private final CategoryGroupRepository categoryGroupRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final FundTransactionRepository fundTransactionRepository;
    private final NotebookBookRepository notebookBookRepository;
    private final NotebookTransactionRepository notebookTransactionRepository;
    private final BudgetService budgetService;

    /**
     * Giao dịch thực tế trong hệ thống chỉ có TOP_UP (nạp) và WITHDRAW (rút).
     * Tab báo cáo gửi lên EXPENSE/INCOME nên cần quy đổi:
     * - Chi tiêu (EXPENSE)  -> tiền RÚT (WITHDRAW).
     * - Thu nhập (INCOME)   -> tiền NẠP (TOP_UP).
     */
    private List<TransactionType> resolveTypes(TransactionType requested) {
        if (requested == TransactionType.EXPENSE) {
            return Arrays.asList(TransactionType.WITHDRAW, TransactionType.TRANSFER, TransactionType.PAYMENT, TransactionType.BANK_LINK_FEE, TransactionType.EXPENSE);
        }
        if (requested == TransactionType.INCOME) {
            return Arrays.asList(TransactionType.TOP_UP, TransactionType.RECEIVE_TRANSFER, TransactionType.INCOME);
        }
        return Collections.singletonList(requested);
    }

    /**
     * Nạp/rút quỹ là chuyển tiền nội bộ giữa ví SmartSpend và quỹ, không phải
     * thu nhập hoặc chi tiêu thực. Giữ chúng ở lịch sử ví nhưng loại khỏi các
     * biểu đồ phân bổ/xu hướng thu chi.
     */
    private List<Transaction> excludeFundTransfers(List<Transaction> transactions) {
        return transactions.stream()
                .filter(t -> {
                    String code = t.getTransactionCode();
                    return code == null || (!code.startsWith("FDEP") && !code.startsWith("FWD"));
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportDistributionResponse> getDistributionReport(User user, TransactionType type, String filter, LocalDate date) {
        LocalDateTime[] dateRange = getDateRange(filter, date);
        Map<Long, BigDecimal> categoryTotals = new HashMap<>();
        WalletTransactionType walletType = type == TransactionType.INCOME
                ? WalletTransactionType.TOP_UP : WalletTransactionType.WITHDRAW;
        NotebookTransactionType notebookType = type == TransactionType.INCOME
                ? NotebookTransactionType.INCOME : NotebookTransactionType.EXPENSE;

        mergeCategoryTotals(categoryTotals, walletTransactionRepository.sumByCategoryForUserAndTypeAndCreatedAtRange(
                user.getId(), walletType, dateRange[0], dateRange[1]));
        // Legacy Transaction rows are included only when no WalletTransaction with the same code exists.
        mergeCategoryTotals(categoryTotals, transactionRepository.sumOrphanByCategoryForUserAndTypesAndStatusAndCreatedAtRange(
                user.getId(), resolveTypes(type), TransactionStatus.SUCCESS, dateRange[0], dateRange[1]));
        mergeCategoryTotals(categoryTotals, notebookTransactionRepository.sumByCategoryForUserAndTypeAndCreatedAtRange(
                user.getId(), notebookType, dateRange[0], dateRange[1]));

        if (categoryTotals.isEmpty()) return Collections.emptyList();
        BigDecimal grandTotal = categoryTotals.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Long> categoryIds = new ArrayList<>(categoryTotals.keySet());
        Map<Long, CategoryItem> categoryMap = categoryItemRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(CategoryItem::getId, c -> c));

        List<ReportDistributionResponse> response = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : categoryTotals.entrySet()) {
            Long catId = entry.getKey();
            BigDecimal totalAmount = entry.getValue();
            Double percentage = totalAmount.divide(grandTotal, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100)).doubleValue();

            String name = "Khác";
            String color = "#A0AEC0";
            String icon = "?";

            if (categoryMap.containsKey(catId)) {
                CategoryItem cat = categoryMap.get(catId);
                boolean systemCategory = cat.getUser() == null
                        || "Nạp quỹ".equals(cat.getLabel())
                        || "Rút quỹ".equals(cat.getLabel())
                        || "Chia tiền".equals(cat.getLabel())
                        || "Chuyển tiền".equals(cat.getLabel())
                        || "Nhận chuyển tiền".equals(cat.getLabel());
                name = (!systemCategory && cat.isDeleted()) ? cat.getLabel() + " (đã xóa)" : cat.getLabel();
                color = cat.getColor();
                icon = cat.getIcon();
            } else {
                name = "Danh mục đã xóa";
                icon = "archive-outline";
            }

            response.add(ReportDistributionResponse.builder()
                    .categoryId(catId)
                    .categoryName(name)
                    .color(color)
                    .icon(icon)
                    .totalAmount(totalAmount)
                    .percentage(percentage)
                    .build());
        }

        // Sort by amount descending
        response.sort((a, b) -> b.getTotalAmount().compareTo(a.getTotalAmount()));

        return response;
    }

    private void mergeCategoryTotals(Map<Long, BigDecimal> target, List<Object[]> rows) {
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null) continue;
            Long categoryId = ((Number) row[0]).longValue();
            BigDecimal amount = row[1] instanceof BigDecimal value
                    ? value : new BigDecimal(row[1].toString());
            target.merge(categoryId, amount, BigDecimal::add);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportDistributionResponse> getGroupDistributionReport(User user, TransactionType type, String filter, LocalDate date) {
        LocalDateTime[] dateRange = getDateRange(filter, date);
        List<Transaction> transactions = excludeFundTransfers(transactionRepository.findByUserAndTypeInAndStatusAndWallet_IsDefaultTrueAndCreatedAtBetween(
                user, resolveTypes(type), TransactionStatus.SUCCESS, dateRange[0], dateRange[1]
        ));

        List<Transaction> classified = transactions.stream()
                .filter(t -> t.getCategoryId() != null)
                .toList();

        if (classified.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> categoryIds = classified.stream()
                .map(Transaction::getCategoryId)
                .distinct()
                .toList();

        Map<Long, CategoryItem> categoryMap = categoryItemRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(CategoryItem::getId, c -> c));

        Map<Long, BigDecimal> groupTotals = new HashMap<>();
        Map<Long, BigDecimal> orphanTotals = new HashMap<>();
        for (Transaction transaction : classified) {
            CategoryItem categoryItem = categoryMap.get(transaction.getCategoryId());
            if (categoryItem == null || categoryItem.getGroup() == null) {
                orphanTotals.merge(transaction.getCategoryId(), transaction.getAmount(), BigDecimal::add);
                continue;
            }
            Long groupId = categoryItem.getGroup().getId();
            groupTotals.merge(groupId, transaction.getAmount(), BigDecimal::add);
        }

        if (groupTotals.isEmpty() && orphanTotals.isEmpty()) {
            return Collections.emptyList();
        }

        BigDecimal grandTotal = groupTotals.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(orphanTotals.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add));

        Map<Long, CategoryGroup> groupMap = categoryGroupRepository.findAllById(groupTotals.keySet()).stream()
                .collect(Collectors.toMap(CategoryGroup::getId, g -> g));

        List<ReportDistributionResponse> response = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : groupTotals.entrySet()) {
            Long groupId = entry.getKey();
            BigDecimal totalAmount = entry.getValue();
            Double percentage = totalAmount.divide(grandTotal, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal(100)).doubleValue();

            String name = "Khác";
            String color = "#A0AEC0";
            String icon = "layers";

            if (groupMap.containsKey(groupId)) {
                CategoryGroup group = groupMap.get(groupId);
                name = group.getTitle();
                color = group.getColor();
                icon = group.getIcon();
            }

            response.add(ReportDistributionResponse.builder()
                    .categoryId(groupId)
                    .categoryName(name)
                    .color(color)
                    .icon(icon)
                    .totalAmount(totalAmount)
                    .percentage(percentage)
                    .build());
        }

        response.sort((a, b) -> b.getTotalAmount().compareTo(a.getTotalAmount()));

        if (!orphanTotals.isEmpty()) {
            BigDecimal orphanAmount = orphanTotals.values().stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            Double orphanPercentage = orphanAmount.divide(grandTotal, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal(100)).doubleValue();
            response.add(ReportDistributionResponse.builder()
                    .categoryId(null)
                    .categoryName("Danh mục đã xóa")
                    .color("#9CA3AF")
                    .icon("archive-outline")
                    .totalAmount(orphanAmount)
                    .percentage(orphanPercentage)
                    .build());
            response.sort((a, b) -> b.getTotalAmount().compareTo(a.getTotalAmount()));
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportTrendResponse> getTrendReport(User user, TransactionType type, String filter, LocalDate date) {
        LocalDateTime[] dateRange = getDateRange(filter, date);
        List<Transaction> transactions = excludeFundTransfers(transactionRepository.findByUserAndTypeInAndStatusAndWallet_IsDefaultTrueAndCreatedAtBetween(
                user, resolveTypes(type), TransactionStatus.SUCCESS, dateRange[0], dateRange[1]
        ));

        // Tab chi tiêu: xu hướng chỉ tính giao dịch rút đã phân loại.
        List<Transaction> forTrend = type == TransactionType.EXPENSE
                ? transactions.stream().filter(t -> t.getCategoryId() != null).toList()
                : transactions;

        List<ReportTrendResponse> trendResponses = new ArrayList<>();
        LocalDate today = LocalDate.now();

        if ("YEAR".equalsIgnoreCase(filter)) {
            // Group by month
            Map<Integer, BigDecimal> monthlyTotals = forTrend.stream()
                    .collect(Collectors.groupingBy(
                            t -> t.getCreatedAt().getMonthValue(),
                            Collectors.mapping(Transaction::getAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                    ));

            for (int i = 1; i <= 12; i++) {
                boolean isCurrent = (date.getYear() == today.getYear() && i == today.getMonthValue());
                trendResponses.add(ReportTrendResponse.builder()
                        .label(isCurrent ? "Tháng này" : "T" + i)
                        .value(monthlyTotals.getOrDefault(i, BigDecimal.ZERO))
                        .isCurrent(isCurrent)
                        .build());
            }
        } else if ("MONTH".equalsIgnoreCase(filter)) {
            // Group by day of month
            int daysInMonth = YearMonth.from(date).lengthOfMonth();
            Map<Integer, BigDecimal> dailyTotals = forTrend.stream()
                    .collect(Collectors.groupingBy(
                            t -> t.getCreatedAt().getDayOfMonth(),
                            Collectors.mapping(Transaction::getAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                    ));

            for (int i = 1; i <= daysInMonth; i++) {
                boolean isCurrent = (date.getYear() == today.getYear() && date.getMonthValue() == today.getMonthValue() && i == today.getDayOfMonth());
                trendResponses.add(ReportTrendResponse.builder()
                        .label(i + "")
                        .value(dailyTotals.getOrDefault(i, BigDecimal.ZERO))
                        .isCurrent(isCurrent)
                        .build());
            }
        } else if ("WEEK".equalsIgnoreCase(filter)) {
            // Group by day of week
            Map<DayOfWeek, BigDecimal> dayOfWeekTotals = forTrend.stream()
                    .collect(Collectors.groupingBy(
                            t -> t.getCreatedAt().getDayOfWeek(),
                            Collectors.mapping(Transaction::getAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                    ));

            DayOfWeek[] days = {DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY};
            String[] labels = {"T2", "T3", "T4", "T5", "T6", "T7", "CN"};

            for (int i = 0; i < 7; i++) {
                DayOfWeek dow = days[i];
                // Check if current day
                boolean isCurrent = false;
                if (date.getYear() == today.getYear() && date.get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR) == today.get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR)) {
                    isCurrent = (dow == today.getDayOfWeek());
                }

                trendResponses.add(ReportTrendResponse.builder()
                        .label(isCurrent ? "Hôm nay" : labels[i])
                        .value(dayOfWeekTotals.getOrDefault(dow, BigDecimal.ZERO))
                        .isCurrent(isCurrent)
                        .build());
            }
        }

        return trendResponses;
    }

    @Override
    @Transactional(readOnly = true)
    public FinanceCenterResponse getFinanceCenter(User user, String period, LocalDate date, LocalDate compareDate) {
        String filter = period == null || period.isBlank() ? "MONTH" : period;
        LocalDate currentDate = date != null ? date : LocalDate.now();
        LocalDate resolvedCompare = compareDate != null ? compareDate : previousPeriodDate(filter, currentDate);

        LocalDateTime[] currentRange = getDateRange(filter, currentDate);
        LocalDateTime[] compareRange = getDateRange(filter, resolvedCompare);

        BigDecimal walletBalance = walletRepository.findByUserIdAndIsDefaultTrue(user.getId())
                .map(Wallet::getBalance)
                .orElse(BigDecimal.ZERO);
        BigDecimal cashBalance = notebookBookRepository.findByUserIdAndBookType(user.getId(), NotebookBookType.CASH)
                .map(NotebookBook::getBalance)
                .orElse(BigDecimal.ZERO);
        BigDecimal totalAssets = nz(walletBalance).add(nz(cashBalance));

        FinanceCenterResponse.PeriodSnapshot current = buildPeriodSnapshot(user.getId(), currentRange);
        FinanceCenterResponse.PeriodSnapshot compare = buildPeriodSnapshot(user.getId(), compareRange);
        FinanceCenterResponse.BudgetOverview budget = buildBudgetOverview(
                user.getId(),
                currentRange[0].toLocalDate(),
                currentRange[1].toLocalDate()
        );

        return FinanceCenterResponse.builder()
                .period(filter.toUpperCase())
                .currentLabel(periodLabel(filter, currentDate))
                .compareLabel(periodLabel(filter, resolvedCompare))
                .currentDate(currentDate)
                .compareDate(resolvedCompare)
                .walletBalance(nz(walletBalance))
                .cashBalance(nz(cashBalance))
                .totalAssets(totalAssets)
                .walletBalancePercent(share(walletBalance, totalAssets))
                .cashBalancePercent(share(cashBalance, totalAssets))
                .current(current)
                .compare(compare)
                .delta(buildPeriodDelta(current, compare))
                .budget(budget)
                .build();
    }

    private FinanceCenterResponse.PeriodSnapshot buildPeriodSnapshot(Long userId, LocalDateTime[] range) {
        FinanceCenterResponse.SourceFlow wallet = buildWalletFlow(userId, range[0], range[1]);
        FinanceCenterResponse.SourceFlow cash = buildCashFlow(userId, range[0], range[1]);
        FinanceCenterResponse.SourceFlow fund = buildFundFlow(userId, range[0], range[1]);
        // Totals combine wallet and notebook flows. Internal fund transfers
        // were already excluded from the wallet flow.
        BigDecimal totalIncome = nz(wallet.getIncome()).add(nz(cash.getIncome()));
        BigDecimal totalExpense = nz(wallet.getExpense()).add(nz(cash.getExpense()));
        return FinanceCenterResponse.PeriodSnapshot.builder()
                .wallet(wallet)
                .cash(cash)
                .fund(fund)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .net(totalIncome.subtract(totalExpense))
                .build();
    }

    private FinanceCenterResponse.BudgetOverview buildBudgetOverview(
            Long userId,
            LocalDate periodStart,
            LocalDate periodEnd) {
        List<BudgetResponse> active = budgetService.listBudgets(userId).stream()
                .filter(budget -> budget.getStatus() != BudgetStatus.INVALIDATED)
                .filter(budget -> !budget.getStartDate().isAfter(periodEnd)
                        && !budget.getEndDate().isBefore(periodStart))
                .toList();

        BigDecimal totalLimit = active.stream()
                .map(BudgetResponse::getLimitAmount)
                .map(ReportServiceImpl::nz)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal spent = active.stream()
                .map(this::budgetSpent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remaining = totalLimit.subtract(spent);
        int overLimitCount = (int) active.stream()
                .filter(budget -> budgetSpent(budget).compareTo(nz(budget.getLimitAmount())) > 0)
                .count();
        int atRiskCount = (int) active.stream()
                .filter(budget -> {
                    BigDecimal limit = nz(budget.getLimitAmount());
                    BigDecimal budgetUsage = budgetSpent(budget);
                    return limit.compareTo(BigDecimal.ZERO) > 0
                            && budgetUsage.compareTo(limit) <= 0
                            && budgetUsage.divide(limit, 4, RoundingMode.HALF_UP)
                            .compareTo(BigDecimal.valueOf(0.8)) >= 0;
                })
                .count();
        double usagePercent = totalLimit.compareTo(BigDecimal.ZERO) == 0
                ? 0d
                : spent.divide(totalLimit, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();

        return FinanceCenterResponse.BudgetOverview.builder()
                .activeCount(active.size())
                .totalLimit(totalLimit)
                .spent(spent)
                .remaining(remaining)
                .overLimitCount(overLimitCount)
                .atRiskCount(atRiskCount)
                .usagePercent(usagePercent)
                .build();
    }

    private BigDecimal budgetSpent(BudgetResponse budget) {
        BudgetSourceSpend total = budget.getTotal();
        if (total != null) {
            return nz(total.getSpent());
        }
        BigDecimal notebook = budget.getNotebook() == null
                ? BigDecimal.ZERO
                : nz(budget.getNotebook().getSpent());
        BigDecimal wallet = budget.getWallet() == null
                ? BigDecimal.ZERO
                : nz(budget.getWallet().getSpent());
        return notebook.add(wallet);
    }

    private FinanceCenterResponse.SourceFlow buildWalletFlow(Long userId, LocalDateTime from, LocalDateTime to) {
        BigDecimal topUp = nz(walletTransactionRepository.sumWalletOnlyAmountByUserAndTypeAndCreatedAtBetween(
                userId, WalletTransactionType.TOP_UP, from, to));
        BigDecimal withdraw = nz(walletTransactionRepository.sumWalletOnlyAmountByUserAndTypeAndCreatedAtBetween(
                userId, WalletTransactionType.WITHDRAW, from, to));

        topUp = topUp.add(nz(transactionRepository.sumOrphanAmountByUserDefaultWalletAndTypeAndStatusAndCreatedAtBetween(
                userId, TransactionType.TOP_UP, TransactionStatus.SUCCESS, from, to)));
        withdraw = withdraw.add(nz(transactionRepository.sumOrphanAmountByUserDefaultWalletAndTypeAndStatusAndCreatedAtBetween(
                userId, TransactionType.WITHDRAW, TransactionStatus.SUCCESS, from, to)));

        return sourceFlow(topUp, withdraw);
    }

    private FinanceCenterResponse.SourceFlow buildFundFlow(Long userId, LocalDateTime from, LocalDateTime to) {
        BigDecimal deposit = nz(fundTransactionRepository.sumAmountByUserAndTypeAndCreatedAtBetween(
                userId, FundTransactionType.DEPOSIT, from, to));
        BigDecimal withdraw = nz(fundTransactionRepository.sumAmountByUserAndTypeAndCreatedAtBetween(
                userId, FundTransactionType.WITHDRAW, from, to));
        return sourceFlow(deposit, withdraw);
    }

    private FinanceCenterResponse.SourceFlow buildCashFlow(Long userId, LocalDateTime from, LocalDateTime to) {
        BigDecimal income = notebookTransactionRepository.sumAmountByUserAndTypeAndCreatedAtBetween(
                userId, NotebookTransactionType.INCOME, from, to);
        BigDecimal expense = notebookTransactionRepository.sumAmountByUserAndTypeAndCreatedAtBetween(
                userId, NotebookTransactionType.EXPENSE, from, to);
        return sourceFlow(income, expense);
    }

    private FinanceCenterResponse.SourceFlow sourceFlow(BigDecimal income, BigDecimal expense) {
        BigDecimal in = nz(income);
        BigDecimal out = nz(expense);
        return FinanceCenterResponse.SourceFlow.builder()
                .income(in)
                .expense(out)
                .net(in.subtract(out))
                .build();
    }

    private FinanceCenterResponse.PeriodDelta buildPeriodDelta(
            FinanceCenterResponse.PeriodSnapshot current,
            FinanceCenterResponse.PeriodSnapshot compare) {
        return FinanceCenterResponse.PeriodDelta.builder()
                .wallet(sourceDelta(current.getWallet(), compare.getWallet()))
                .cash(sourceDelta(current.getCash(), compare.getCash()))
                .totalIncome(amountDelta(current.getTotalIncome(), compare.getTotalIncome()))
                .totalExpense(amountDelta(current.getTotalExpense(), compare.getTotalExpense()))
                .net(amountDelta(current.getNet(), compare.getNet()))
                .build();
    }

    private FinanceCenterResponse.SourceDelta sourceDelta(
            FinanceCenterResponse.SourceFlow current,
            FinanceCenterResponse.SourceFlow compare) {
        return FinanceCenterResponse.SourceDelta.builder()
                .income(amountDelta(current.getIncome(), compare.getIncome()))
                .expense(amountDelta(current.getExpense(), compare.getExpense()))
                .net(amountDelta(current.getNet(), compare.getNet()))
                .build();
    }

    private FinanceCenterResponse.AmountDelta amountDelta(BigDecimal current, BigDecimal compare) {
        BigDecimal c = nz(current);
        BigDecimal p = nz(compare);
        BigDecimal amount = c.subtract(p);
        Double percent;
        if (p.compareTo(BigDecimal.ZERO) == 0) {
            percent = c.compareTo(BigDecimal.ZERO) == 0 ? 0d : null;
        } else {
            percent = amount.divide(p, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }
        return FinanceCenterResponse.AmountDelta.builder()
                .amount(amount)
                .percent(percent)
                .build();
    }

    private LocalDate previousPeriodDate(String filter, LocalDate date) {
        if ("YEAR".equalsIgnoreCase(filter)) {
            return date.minusYears(1);
        }
        if ("WEEK".equalsIgnoreCase(filter)) {
            return date.minusWeeks(1);
        }
        return date.minusMonths(1);
    }

    private String periodLabel(String filter, LocalDate date) {
        if ("YEAR".equalsIgnoreCase(filter)) {
            return "Năm " + date.getYear();
        }
        if ("WEEK".equalsIgnoreCase(filter)) {
            LocalDate start = date.with(DayOfWeek.MONDAY);
            LocalDate end = date.with(DayOfWeek.SUNDAY);
            return start.getDayOfMonth() + "/" + start.getMonthValue()
                    + " – " + end.getDayOfMonth() + "/" + end.getMonthValue() + "/" + end.getYear();
        }
        return "Tháng " + date.getMonthValue() + "/" + date.getYear();
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static Double share(BigDecimal part, BigDecimal total) {
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) {
            return 0d;
        }
        return nz(part).divide(total, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private LocalDateTime[] getDateRange(String filter, LocalDate date) {
        LocalDateTime start, end;
        if ("DAY".equalsIgnoreCase(filter) || "TODAY".equalsIgnoreCase(filter)) {
            start = date.atStartOfDay();
            end = date.atTime(LocalTime.MAX);
        } else if ("YESTERDAY".equalsIgnoreCase(filter)) {
            LocalDate yesterday = date.minusDays(1);
            start = yesterday.atStartOfDay();
            end = yesterday.atTime(LocalTime.MAX);
        } else if ("YEAR".equalsIgnoreCase(filter)) {
            start = date.with(TemporalAdjusters.firstDayOfYear()).atStartOfDay();
            end = date.with(TemporalAdjusters.lastDayOfYear()).atTime(LocalTime.MAX);
        } else if ("MONTH".equalsIgnoreCase(filter)) {
            start = date.with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay();
            end = date.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);
        } else if ("WEEK".equalsIgnoreCase(filter)) {
            start = date.with(DayOfWeek.MONDAY).atStartOfDay();
            end = date.with(DayOfWeek.SUNDAY).atTime(LocalTime.MAX);
        } else {
            // Default to month
            start = date.with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay();
            end = date.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);
        }
        return new LocalDateTime[]{start, end};
    }
}
