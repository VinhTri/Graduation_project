package com.project.app.report.service.impl;

import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryItemRepository;
import com.project.app.report.dto.response.ReportDistributionResponse;
import com.project.app.report.dto.response.ReportTrendResponse;
import com.project.app.report.service.ReportService;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.entity.TransactionStatus;
import com.project.app.transaction.entity.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

    @Override
    public List<ReportDistributionResponse> getDistributionReport(User user, TransactionType type, String filter, LocalDate date) {
        LocalDateTime[] dateRange = getDateRange(filter, date);
        List<Transaction> transactions = transactionRepository.findByUserAndTypeAndStatusAndCreatedAtBetween(
                user, type, TransactionStatus.SUCCESS, dateRange[0], dateRange[1]
        );

        if (transactions.isEmpty()) {
            return Collections.emptyList();
        }

        BigDecimal grandTotal = transactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<Long, BigDecimal> categoryTotals = transactions.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getCategoryId() != null ? t.getCategoryId() : 0L,
                        Collectors.mapping(Transaction::getAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        List<Long> categoryIds = new ArrayList<>(categoryTotals.keySet());
        categoryIds.remove(0L);
        Map<Long, CategoryItem> categoryMap = categoryItemRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(CategoryItem::getId, c -> c));

        List<ReportDistributionResponse> response = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : categoryTotals.entrySet()) {
            Long catId = entry.getKey();
            BigDecimal totalAmount = entry.getValue();
            Double percentage = totalAmount.divide(grandTotal, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100)).doubleValue();

            String name = "Chưa phân loại";
            String color = "#A0AEC0"; // Default
            String icon = "?";

            if (catId != 0L && categoryMap.containsKey(catId)) {
                CategoryItem cat = categoryMap.get(catId);
                name = cat.getLabel();
                color = cat.getColor();
                icon = cat.getIcon();
            }

            response.add(ReportDistributionResponse.builder()
                    .categoryId(catId == 0L ? null : catId)
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
    public List<ReportTrendResponse> getTrendReport(User user, TransactionType type, String filter, LocalDate date) {
        LocalDateTime[] dateRange = getDateRange(filter, date);
        List<Transaction> transactions = transactionRepository.findByUserAndTypeAndStatusAndCreatedAtBetween(
                user, type, TransactionStatus.SUCCESS, dateRange[0], dateRange[1]
        );

        List<ReportTrendResponse> trendResponses = new ArrayList<>();
        LocalDate today = LocalDate.now();

        if ("YEAR".equalsIgnoreCase(filter)) {
            // Group by month
            Map<Integer, BigDecimal> monthlyTotals = transactions.stream()
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
            Map<Integer, BigDecimal> dailyTotals = transactions.stream()
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
            Map<DayOfWeek, BigDecimal> dayOfWeekTotals = transactions.stream()
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
        if ("YEAR".equalsIgnoreCase(filter)) {
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
