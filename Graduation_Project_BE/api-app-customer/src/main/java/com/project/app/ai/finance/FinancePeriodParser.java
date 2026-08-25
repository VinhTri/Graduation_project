package com.project.app.ai.finance;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class FinancePeriodParser {

    private static final Pattern MONTH_NUMBER = Pattern.compile(
            "(?i)(?:tháng|thang)\\s*(\\d{1,2})(?:\\s*[/\\-]\\s*(\\d{4}))?");
    private static final Pattern YEAR_NUMBER = Pattern.compile("(?i)(?:năm|nam)\\s*(\\d{4})");
    private static final Pattern ISO_DATE = Pattern.compile("(\\d{4})-(\\d{2})-(\\d{2})");

    public ResolvedPeriod parse(String message) {
        if (message == null || message.isBlank()) {
            return ResolvedPeriod.defaults();
        }

        String normalized = normalize(message);
        LocalDate today = LocalDate.now();
        String period = detectPeriod(normalized);
        LocalDate anchor = today;
        LocalDate compare = null;

        // Khi cau so sanh chua ca ky hien tai va ky truoc, ky hien tai la moc chinh.
        // Vi du: "thang nay so voi thang truoc" phai la thang nay vs thang truoc,
        // khong phai thang truoc vs hai thang truoc.
        if (containsAny(normalized, "tuan nay", "tuan hien tai")) {
            period = "WEEK";
            anchor = today;
        } else if (containsAny(normalized, "tuan truoc")) {
            period = "WEEK";
            anchor = today.minusWeeks(1);
        } else if (containsAny(normalized, "thang nay")) {
            period = "MONTH";
            anchor = today;
        } else if (containsAny(normalized, "thang truoc")) {
            period = "MONTH";
            anchor = today.minusMonths(1);
        } else if (containsAny(normalized, "nam nay")) {
            period = "YEAR";
            anchor = today;
        } else if (containsAny(normalized, "nam ngoai")) {
            period = "YEAR";
            anchor = today.minusYears(1);
        } else {
            Matcher monthMatcher = MONTH_NUMBER.matcher(message);
            if (monthMatcher.find()) {
                period = "MONTH";
                int month = Integer.parseInt(monthMatcher.group(1));
                int year = monthMatcher.group(2) != null
                        ? Integer.parseInt(monthMatcher.group(2))
                        : today.getYear();
                anchor = safeDate(year, month, 15);
            } else {
                Matcher yearMatcher = YEAR_NUMBER.matcher(message);
                if (yearMatcher.find()) {
                    period = "YEAR";
                    int year = Integer.parseInt(yearMatcher.group(1));
                    anchor = safeDate(year, 6, 30);
                }
            }
        }

        Matcher isoMatcher = ISO_DATE.matcher(message);
        if (isoMatcher.find()) {
            anchor = LocalDate.of(
                    Integer.parseInt(isoMatcher.group(1)),
                    Integer.parseInt(isoMatcher.group(2)),
                    Integer.parseInt(isoMatcher.group(3)));
        }

        if (anchor.isAfter(today)) {
            anchor = today;
        }

        if (containsAny(normalized, "so sanh", "so voi", "vs", "dau voi")) {
            compare = null;
        }

        return new ResolvedPeriod(period.toUpperCase(Locale.ROOT), anchor, compare);
    }

    public LocalDate defaultCompareDate(String period, LocalDate anchorDate) {
        if ("YEAR".equalsIgnoreCase(period)) {
            return anchorDate.minusYears(1);
        }
        if ("WEEK".equalsIgnoreCase(period)) {
            return anchorDate.minusWeeks(1);
        }
        return anchorDate.minusMonths(1);
    }

    public String periodLabel(String period, LocalDate date) {
        if ("YEAR".equalsIgnoreCase(period)) {
            return "Năm " + date.getYear();
        }
        if ("WEEK".equalsIgnoreCase(period)) {
            LocalDate start = date.with(DayOfWeek.MONDAY);
            LocalDate end = date.with(DayOfWeek.SUNDAY);
            return start.getDayOfMonth() + "/" + start.getMonthValue()
                    + " – " + end.getDayOfMonth() + "/" + end.getMonthValue() + "/" + end.getYear();
        }
        return "Tháng " + date.getMonthValue() + "/" + date.getYear();
    }

    private String detectPeriod(String normalized) {
        if (containsAny(normalized, "tuan", "week")) {
            return "WEEK";
        }
        if (containsAny(normalized, "nam nay", "nam ngoai", "nam 20", " ca nam", " ca nam")) {
            return "YEAR";
        }
        if (normalized.contains("nam ") && !normalized.contains("thang")) {
            return "YEAR";
        }
        if (containsAny(normalized, "thang", "month")) {
            return "MONTH";
        }
        return "MONTH";
    }

    private LocalDate safeDate(int year, int month, int day) {
        try {
            return LocalDate.of(year, month, Math.min(day, LocalDate.of(year, month, 1).lengthOfMonth()));
        } catch (Exception e) {
            return LocalDate.now();
        }
    }

    private String normalize(String message) {
        String withoutMarks = Normalizer.normalize(message, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return withoutMarks.trim()
                .toLowerCase(Locale.ROOT)
                .replace('đ', 'd')
                .replaceAll("\\s+", " ");
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
