package com.project.app.ai.parser;

import com.project.app.ai.dto.internal.ParsedDuration;
import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DurationParser {

    public ParsedDuration parseDuration(String rawText, String normalizedText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return ParsedDuration.builder()
                    .originalTimeText(null)
                    .durationMonths(0)
                    .durationDays(0)
                    .isDays(false)
                    .build();
        }

        String normText = normalizedText != null ? normalizedText : normalizeText(rawText);

        // 1. Compound Year + Month (e.g., "1 năm 6 tháng", "2 năm 3 tháng")
        Matcher mCompound = Pattern.compile("(\\d+)\\s*nam\\s*(\\d+)\\s*thang", Pattern.CASE_INSENSITIVE).matcher(normText);
        if (mCompound.find()) {
            int years = Integer.parseInt(mCompound.group(1));
            int months = Integer.parseInt(mCompound.group(2));
            int totalMonths = years * 12 + months;
            String origText = extractOriginalSubstring(rawText, "(\\d+\\s*(?:năm|nam)\\s*\\d+\\s*(?:tháng|thang))", years + " năm " + months + " tháng");
            return ParsedDuration.builder()
                    .originalTimeText(origText)
                    .durationMonths(totalMonths)
                    .durationDays(totalMonths * 30)
                    .isDays(false)
                    .build();
        }

        // 2. Day-based matcher (e.g., "45 ngày", "90 ngày", "15 ngày", "100 ngày")
        Matcher mDay = Pattern.compile("(\\d+)\\s*ngay", Pattern.CASE_INSENSITIVE).matcher(normText);
        if (mDay.find()) {
            int days = Integer.parseInt(mDay.group(1));
            int months = (int) Math.max(1, Math.round((double) days / 30.4375));
            String origText = extractOriginalSubstring(rawText, "(\\d+\\s*(?:ngày|ngay))", days + " ngày");
            return ParsedDuration.builder()
                    .originalTimeText(origText)
                    .durationMonths(months)
                    .durationDays(days)
                    .isDays(true)
                    .build();
        }

        // 3. Pure Year matcher (e.g., "1 năm", "2 năm", "3 năm", "1.5 năm")
        Matcher mYear = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*nam", Pattern.CASE_INSENSITIVE).matcher(normText);
        if (mYear.find()) {
            double val = Double.parseDouble(mYear.group(1).replace(",", "."));
            int compoundMonths = (int) Math.round(val * 12);
            String origText = extractOriginalSubstring(rawText, "(\\d+(?:[.,]\\d+)?\\s*(?:năm|nam))", (val == (int) val ? (int) val : val) + " năm");
            return ParsedDuration.builder()
                    .originalTimeText(origText)
                    .durationMonths(compoundMonths)
                    .durationDays(compoundMonths * 30)
                    .isDays(false)
                    .build();
        }

        // 4. Pure Month matcher (e.g., "6 tháng", "18 tháng")
        Matcher mMonth = Pattern.compile("(\\d+)\\s*thang", Pattern.CASE_INSENSITIVE).matcher(normText);
        if (mMonth.find()) {
            String trailing = normText.substring(Math.min(mMonth.end(), normText.length())).trim();
            if (!trailing.startsWith("toi phai") && !trailing.startsWith("bao nhieu") && !trailing.startsWith("can tiet kiem") && !trailing.startsWith("de danh")) {
                int months = Integer.parseInt(mMonth.group(1));
                String origText = extractOriginalSubstring(rawText, "(\\d+\\s*(?:tháng|thang))", months + " tháng");
                return ParsedDuration.builder()
                        .originalTimeText(origText)
                        .durationMonths(months)
                        .durationDays(months * 30)
                        .isDays(false)
                        .build();
            }
        }

        // 5. Dynamic Natural Time Expressions relative to current date
        LocalDate now = LocalDate.now();

        if (normText.contains("cuoi nam") || normText.contains("trong nam nay")) {
            LocalDate endOfYear = LocalDate.of(now.getYear(), 12, 31);
            long days = ChronoUnit.DAYS.between(now, endOfYear);
            if (days <= 0) days = 365;
            int months = (int) Math.max(1, Math.round((double) days / 30.4375));
            String origText = normText.contains("trong nam nay") ? "trong năm nay" : "cuối năm";
            return ParsedDuration.builder()
                    .originalTimeText(origText)
                    .durationMonths(months)
                    .durationDays((int) days)
                    .isDays(false)
                    .build();
        }

        if (normText.contains("dau nam sau") || normText.contains("sang nam") || normText.contains("nam sau")) {
            LocalDate targetDate = LocalDate.of(now.getYear() + 1, 1, 31);
            long days = ChronoUnit.DAYS.between(now, targetDate);
            int months = (int) Math.max(1, Math.round((double) days / 30.4375));
            String origText = normText.contains("dau nam sau") ? "đầu năm sau" : (normText.contains("sang nam") ? "sang năm" : "năm sau");
            return ParsedDuration.builder()
                    .originalTimeText(origText)
                    .durationMonths(months)
                    .durationDays((int) days)
                    .isDays(false)
                    .build();
        }

        if (normText.contains("truoc tet") || normText.contains("don tet") || normText.contains("tet")) {
            int targetYear = now.getMonthValue() > 2 ? now.getYear() + 1 : now.getYear();
            LocalDate tetDate = LocalDate.of(targetYear, 2, 10);
            long days = ChronoUnit.DAYS.between(now, tetDate);
            int months = (int) Math.max(1, Math.round((double) days / 30.4375));
            String origText = normText.contains("truoc tet") ? "trước Tết" : "Tết";
            return ParsedDuration.builder()
                    .originalTimeText(origText)
                    .durationMonths(months)
                    .durationDays((int) days)
                    .isDays(false)
                    .build();
        }

        if (normText.contains("cuoi thang sau")) {
            return ParsedDuration.builder()
                    .originalTimeText("cuối tháng sau")
                    .durationMonths(2)
                    .durationDays(60)
                    .isDays(false)
                    .build();
        }

        if (normText.contains("thang sau")) {
            return ParsedDuration.builder()
                    .originalTimeText("tháng sau")
                    .durationMonths(1)
                    .durationDays(30)
                    .isDays(false)
                    .build();
        }

        if (normText.contains("cuoi thang")) {
            LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
            long days = Math.max(1, ChronoUnit.DAYS.between(now, endOfMonth));
            return ParsedDuration.builder()
                    .originalTimeText("cuối tháng")
                    .durationMonths(1)
                    .durationDays((int) days)
                    .isDays(days < 30)
                    .build();
        }

        if (normText.contains("sinh nhat")) {
            return ParsedDuration.builder()
                    .originalTimeText("sinh nhật")
                    .durationMonths(6)
                    .durationDays(180)
                    .isDays(false)
                    .build();
        }

        return ParsedDuration.builder()
                .originalTimeText(null)
                .durationMonths(0)
                .durationDays(0)
                .isDays(false)
                .build();
    }

    public int parse(String text, String normalizedText) {
        ParsedDuration pd = parseDuration(text, normalizedText);
        return pd != null ? pd.getDurationMonths() : 0;
    }

    private String extractOriginalSubstring(String rawText, String regexPattern, String fallback) {
        if (rawText == null) return fallback;
        Matcher matcher = Pattern.compile(regexPattern, Pattern.CASE_INSENSITIVE).matcher(rawText);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return fallback;
    }

    public Integer extractRelativeMonthDelta(String normText) {
        if (normText == null || normText.isEmpty()) return null;

        // Match extension: "tăng thời gian thêm 6 tháng", "thêm 6 tháng", "kéo dài 6 tháng", "tăng 6 tháng"
        Pattern pAdd = Pattern.compile("(?:tang|them|keo dai|cong)(?:\\s+thoi\\s+gian)?(?:\\s+them)?\\s+(\\d+)\\s*(thang|nam)", Pattern.CASE_INSENSITIVE);
        Matcher mAdd = pAdd.matcher(normText);
        if (mAdd.find()) {
            int val = Integer.parseInt(mAdd.group(1));
            String unit = mAdd.group(2).toLowerCase();
            if ("nam".equals(unit)) {
                val *= 12;
            }
            return val;
        }

        // Match reduction: "rút ngắn 6 tháng", "giảm 6 tháng", "bớt 6 tháng"
        Pattern pSub = Pattern.compile("(?:rut ngan|giam|bot)(?:\\s+thoi\\s+gian)?(?:\\s+di)?\\s+(\\d+)\\s*(thang|nam)", Pattern.CASE_INSENSITIVE);
        Matcher mSub = pSub.matcher(normText);
        if (mSub.find()) {
            int val = Integer.parseInt(mSub.group(1));
            String unit = mSub.group(2).toLowerCase();
            if ("nam".equals(unit)) {
                val *= 12;
            }
            return -val;
        }

        return null;
    }

    public ParsedDuration parseLatestParsedDurationFromHistory(List<ChatMessageHistoryDto> history) {
        if (history != null) {
            for (int i = history.size() - 1; i >= 0; i--) {
                ChatMessageHistoryDto msg = history.get(i);
                if (msg != null && msg.getContent() != null && "user".equalsIgnoreCase(msg.getRole())) {
                    ParsedDuration pd = parseDuration(msg.getContent(), normalizeText(msg.getContent()));
                    if (pd != null && (pd.getDurationMonths() > 0 || pd.getDurationDays() > 0)) {
                        return pd;
                    }
                }
            }
        }
        return null;
    }

    public int parseLatestDurationFromHistory(List<ChatMessageHistoryDto> history) {
        ParsedDuration pd = parseLatestParsedDurationFromHistory(history);
        return pd != null ? pd.getDurationMonths() : 0;
    }

    public int parseGoalMonths(String currentText, List<ChatMessageHistoryDto> history, boolean isNewGoal) {
        String currentNorm = normalizeText(currentText);

        Integer delta = extractRelativeMonthDelta(currentNorm);
        if (delta != null && !isNewGoal) {
            int prevMonths = parseLatestDurationFromHistory(history);
            if (prevMonths > 0) {
                return Math.max(1, prevMonths + delta);
            }
        }

        int currentMonths = parse(currentText, currentNorm);
        if (currentMonths > 0) return currentMonths;
        
        if (!isNewGoal) {
            int historyMonths = parseLatestDurationFromHistory(history);
            if (historyMonths > 0) return historyMonths;
        }

        return 6;
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d")
                .trim();
    }
}
