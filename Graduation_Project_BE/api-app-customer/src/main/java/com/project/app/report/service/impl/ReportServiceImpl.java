package com.project.app.report.service.impl;

import com.project.app.category.entity.CategoryGroup;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryGroupRepository;
import com.project.app.category.repository.CategoryItemRepository;
import com.project.app.report.dto.response.ReportDistributionResponse;
import com.project.app.report.dto.response.ReportTrendResponse;
import com.project.app.report.service.ReportService;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.User;
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

    /**
     * Giao dịch thực tế trong hệ thống chỉ có TOP_UP (nạp) và WITHDRAW (rút).
     * Tab báo cáo gửi lên EXPENSE/INCOME nên cần quy đổi:
     * - Chi tiêu (EXPENSE)  -> tiền RÚT (WITHDRAW).
     * - Thu nhập (INCOME)   -> tiền NẠP (TOP_UP).
     */
    private TransactionType resolveType(TransactionType requested) {
        if (requested == TransactionType.EXPENSE) return TransactionType.WITHDRAW;
        if (requested == TransactionType.INCOME) return TransactionType.TOP_UP;
        return requested;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportDistributionResponse> getDistributionReport(User user, TransactionType type, String filter, LocalDate date) {
        LocalDateTime[] dateRange = getDateRange(filter, date);
        List<Transaction> transactions = transactionRepository.findByUserAndTypeAndStatusAndWallet_IsDefaultTrueAndCreatedAtBetween(
                user, resolveType(type), TransactionStatus.SUCCESS, dateRange[0], dateRange[1]
        );

        // Chỉ phân tích giao dịch đã gắn danh mục; chưa phân loại hiển thị riêng trên FE.
        List<Transaction> classified = transactions.stream()
                .filter(t -> t.getCategoryId() != null)
                .toList();

        if (classified.isEmpty()) {
            return Collections.emptyList();
        }

        BigDecimal grandTotal = classified.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<Long, BigDecimal> categoryTotals = classified.stream()
                .collect(Collectors.groupingBy(
                        Transaction::getCategoryId,
                        Collectors.mapping(Transaction::getAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

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
                name = cat.isDeleted() ? cat.getLabel() + " (đã xóa)" : cat.getLabel();
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

    @Override
    @Transactional(readOnly = true)
    public List<ReportDistributionResponse> getGroupDistributionReport(User user, TransactionType type, String filter, LocalDate date) {
        LocalDateTime[] dateRange = getDateRange(filter, date);
        List<Transaction> transactions = transactionRepository.findByUserAndTypeAndStatusAndWallet_IsDefaultTrueAndCreatedAtBetween(
                user, resolveType(type), TransactionStatus.SUCCESS, dateRange[0], dateRange[1]
        );

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
        List<Transaction> transactions = transactionRepository.findByUserAndTypeAndStatusAndWallet_IsDefaultTrueAndCreatedAtBetween(
                user, resolveType(type), TransactionStatus.SUCCESS, dateRange[0], dateRange[1]
        );

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
