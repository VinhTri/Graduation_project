package com.project.app.ai.parser;

import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DurationParser {

    public int parse(String text, String normalizedText) {
        if (text == null || text.trim().isEmpty()) return 0;
        String normText = normalizeText(text);

        int compoundMonths = 0;

        // 1. Check explicit year matcher (e.g., "1 năm", "2 năm", "1.5 năm")
        Matcher mYear = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*nam", Pattern.CASE_INSENSITIVE).matcher(normText);
        if (mYear.find()) {
            double val = Double.parseDouble(mYear.group(1).replace(",", "."));
            compoundMonths += (int) Math.round(val * 12);
        }

        // 2. Check explicit month matcher (e.g., "4 tháng", "6 tháng")
        Matcher mExplicit = Pattern.compile("(\\d+)\\s*thang", Pattern.CASE_INSENSITIVE).matcher(normText);
        if (mExplicit.find()) {
            String trailing = normText.substring(Math.min(mExplicit.end(), normText.length())).trim();
            if (!trailing.startsWith("toi phai") && !trailing.startsWith("bao nhieu") && !trailing.startsWith("can tiet kiem") && !trailing.startsWith("de danh")) {
                compoundMonths += Integer.parseInt(mExplicit.group(1));
            }
        }

        if (compoundMonths > 0) {
            return compoundMonths;
        }

        // 3. Dynamic Natural Time Expressions calculated relative to current date (LocalDate.now())
        LocalDate now = LocalDate.now();

        if (normText.contains("cuoi nam")) {
            LocalDate endOfYear = LocalDate.of(now.getYear(), 12, 31);
            long days = ChronoUnit.DAYS.between(now, endOfYear);
            return (int) Math.max(1, Math.round((double) days / 30.4375));
        }

        if (normText.contains("truoc tet") || normText.contains("don tet") || normText.contains("tet")) {
            int targetYear = now.getMonthValue() > 2 ? now.getYear() + 1 : now.getYear();
            LocalDate tetDate = LocalDate.of(targetYear, 2, 10);
            long days = ChronoUnit.DAYS.between(now, tetDate);
            return (int) Math.max(1, Math.round((double) days / 30.4375));
        }

        if (normText.contains("thang sau")) return 2;
        if (normText.contains("cuoi thang")) return 1;
        if (normText.contains("nam sau") || normText.contains("sang nam")) return 12;
        if (normText.contains("sinh nhat")) return 6;

        return 0;
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

    public int parseLatestDurationFromHistory(List<ChatMessageHistoryDto> history) {
        if (history != null) {
            for (int i = history.size() - 1; i >= 0; i--) {
                ChatMessageHistoryDto msg = history.get(i);
                if (msg != null && msg.getContent() != null && "user".equalsIgnoreCase(msg.getRole())) {
                    int months = parse(msg.getContent(), normalizeText(msg.getContent()));
                    if (months > 0) {
                        return months;
                    }
                }
            }
        }
        return 0;
    }

    public int parseGoalMonths(String currentText, List<ChatMessageHistoryDto> history, boolean isNewGoal) {
        String currentNorm = normalizeText(currentText);

        // Check relative duration changes first (e.g. "tăng thời gian thêm 6 tháng", "rút ngắn 6 tháng")
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
