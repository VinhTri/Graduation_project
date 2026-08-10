package com.project.app.ai.service;

import com.project.app.ai.dto.internal.DurationInfo;
import com.project.app.ai.dto.internal.ParsedDuration;
import com.project.app.ai.parser.DurationParser;
import com.project.app.ai.util.TextNormalizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DateResolverService {

    private final DurationParser durationParser;

    private static final Map<Integer, LocalDate> LUNAR_NEW_YEAR_MAP = new HashMap<>();

    static {
        LUNAR_NEW_YEAR_MAP.put(2024, LocalDate.of(2024, 2, 10));
        LUNAR_NEW_YEAR_MAP.put(2025, LocalDate.of(2025, 1, 29));
        LUNAR_NEW_YEAR_MAP.put(2026, LocalDate.of(2026, 2, 17));
        LUNAR_NEW_YEAR_MAP.put(2027, LocalDate.of(2027, 2, 6));
        LUNAR_NEW_YEAR_MAP.put(2028, LocalDate.of(2028, 1, 26));
        LUNAR_NEW_YEAR_MAP.put(2029, LocalDate.of(2029, 2, 13));
        LUNAR_NEW_YEAR_MAP.put(2030, LocalDate.of(2030, 2, 3));
        LUNAR_NEW_YEAR_MAP.put(2031, LocalDate.of(2031, 1, 23));
        LUNAR_NEW_YEAR_MAP.put(2032, LocalDate.of(2032, 2, 11));
        LUNAR_NEW_YEAR_MAP.put(2033, LocalDate.of(2033, 1, 31));
        LUNAR_NEW_YEAR_MAP.put(2034, LocalDate.of(2034, 2, 19));
        LUNAR_NEW_YEAR_MAP.put(2035, LocalDate.of(2035, 2, 8));
    }

    public DurationInfo resolveDuration(String timeText, LocalDate now) {
        if (now == null) {
            now = LocalDate.now();
        }
        if (timeText == null || timeText.trim().isEmpty()) {
            return DurationInfo.builder()
                    .originalText(null)
                    .months(0)
                    .days(0)
                    .type(DurationInfo.DurationType.MONTHS)
                    .operation(DurationInfo.DurationOperation.SET)
                    .build();
        }

        String norm = TextNormalizer.normalize(timeText);

        // Detect Operation: ADD, SUBTRACT, or SET
        DurationInfo.DurationOperation op = DurationInfo.DurationOperation.SET;
        if (norm.contains("them") || norm.contains("tang") || norm.contains("tang them") || norm.contains("cong them")) {
            op = DurationInfo.DurationOperation.ADD;
        } else if (norm.contains("bot") || norm.contains("giam") || norm.contains("tru di") || norm.contains("giam di")) {
            op = DurationInfo.DurationOperation.SUBTRACT;
        }

        // 1. Check numeric durations first via DurationParser
        ParsedDuration pd = durationParser.parseDuration(timeText, null);
        if (pd != null && (pd.getDurationMonths() > 0 || pd.getDurationDays() > 0)) {
            String cleanText = (pd.getOriginalTimeText() != null && !pd.getOriginalTimeText().isEmpty())
                    ? pd.getOriginalTimeText()
                    : (pd.isDays() ? pd.getDurationDays() + " ngày" : pd.getDurationMonths() + " tháng");

            return DurationInfo.builder()
                    .originalText(cleanText)
                    .months(pd.getDurationMonths())
                    .days(pd.getDurationDays())
                    .type(pd.isDays() ? DurationInfo.DurationType.DAYS : DurationInfo.DurationType.MONTHS)
                    .operation(op)
                    .build();
        }

        // 2. Relative Milestone Resolution: Tết
        if (norm.contains("tet") || norm.contains("truoc tet") || norm.contains("don tet")) {
            int currentYear = now.getYear();
            LocalDate tetDate = LUNAR_NEW_YEAR_MAP.get(currentYear);
            if (tetDate == null || tetDate.isBefore(now)) {
                tetDate = LUNAR_NEW_YEAR_MAP.get(currentYear + 1);
            }
            if (tetDate == null) {
                tetDate = LocalDate.of(currentYear + 1, 2, 10);
            }
            long days = ChronoUnit.DAYS.between(now, tetDate);
            if (days <= 0) days = 30;
            int months = (int) Math.max(1, Math.round((double) days / 30.4375));

            return DurationInfo.builder()
                    .originalText("trước Tết")
                    .targetDate(tetDate)
                    .days((int) days)
                    .months(months)
                    .type(DurationInfo.DurationType.RELATIVE_DATE)
                    .operation(op)
                    .build();
        }

        // 3. Relative Milestone Resolution: Cuối năm / Trong năm nay
        if (norm.contains("cuoi nam") || norm.contains("trong nam nay")) {
            LocalDate endOfYear = LocalDate.of(now.getYear(), 12, 31);
            long days = ChronoUnit.DAYS.between(now, endOfYear);
            if (days <= 0) {
                endOfYear = LocalDate.of(now.getYear() + 1, 12, 31);
                days = ChronoUnit.DAYS.between(now, endOfYear);
            }
            int months = (int) Math.max(1, Math.round((double) days / 30.4375));

            return DurationInfo.builder()
                    .originalText(norm.contains("trong nam nay") ? "trong năm nay" : "cuối năm")
                    .targetDate(endOfYear)
                    .days((int) days)
                    .months(months)
                    .type(DurationInfo.DurationType.RELATIVE_DATE)
                    .operation(op)
                    .build();
        }

        // 4. Relative Milestone Resolution: Đầu năm sau
        if (norm.contains("dau nam sau") || norm.contains("sang nam") || norm.contains("nam sau")) {
            LocalDate targetDate = LocalDate.of(now.getYear() + 1, 1, 1);
            long days = ChronoUnit.DAYS.between(now, targetDate);
            if (days <= 0) days = 1;
            int months = (int) Math.max(1, Math.round((double) days / 30.4375));

            return DurationInfo.builder()
                    .originalText(norm.contains("dau nam sau") ? "đầu năm sau" : (norm.contains("sang nam") ? "sang năm" : "năm sau"))
                    .targetDate(targetDate)
                    .days((int) days)
                    .months(months)
                    .type(DurationInfo.DurationType.RELATIVE_DATE)
                    .operation(op)
                    .build();
        }

        // 5. Relative Milestone Resolution: Cuối tháng sau / Cuối tháng
        if (norm.contains("cuoi thang sau")) {
            LocalDate nextMonth = now.plusMonths(1);
            YearMonth yearMonth = YearMonth.from(nextMonth);
            LocalDate endOfNextMonth = yearMonth.atEndOfMonth();
            long days = ChronoUnit.DAYS.between(now, endOfNextMonth);
            int months = (int) Math.max(1, Math.round((double) days / 30.4375));

            return DurationInfo.builder()
                    .originalText("cuối tháng sau")
                    .targetDate(endOfNextMonth)
                    .days((int) days)
                    .months(months)
                    .type(DurationInfo.DurationType.RELATIVE_DATE)
                    .operation(op)
                    .build();
        }

        if (norm.contains("cuoi thang")) {
            YearMonth yearMonth = YearMonth.from(now);
            LocalDate endOfMonth = yearMonth.atEndOfMonth();
            long days = ChronoUnit.DAYS.between(now, endOfMonth);
            if (days <= 0) days = 1;
            int months = (int) Math.max(1, Math.round((double) days / 30.4375));

            return DurationInfo.builder()
                    .originalText("cuối tháng")
                    .targetDate(endOfMonth)
                    .days((int) days)
                    .months(months)
                    .type(DurationInfo.DurationType.RELATIVE_DATE)
                    .operation(op)
                    .build();
        }

        // 6. Relative Milestone Resolution: Tháng sau
        if (norm.contains("thang sau")) {
            LocalDate targetDate = now.plusMonths(1);
            long days = ChronoUnit.DAYS.between(now, targetDate);
            int months = (int) Math.max(1, Math.round((double) days / 30.4375));

            return DurationInfo.builder()
                    .originalText("tháng sau")
                    .targetDate(targetDate)
                    .days((int) days)
                    .months(months)
                    .type(DurationInfo.DurationType.RELATIVE_DATE)
                    .operation(op)
                    .build();
        }

        return DurationInfo.builder()
                .originalText(null)
                .months(0)
                .days(0)
                .type(DurationInfo.DurationType.MONTHS)
                .operation(op)
                .build();
    }

    public LocalDate getLunarNewYearDate(int year) {
        return LUNAR_NEW_YEAR_MAP.getOrDefault(year, LocalDate.of(year, 2, 10));
    }
}
