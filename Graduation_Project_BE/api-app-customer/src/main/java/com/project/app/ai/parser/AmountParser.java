package com.project.app.ai.parser;

import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class AmountParser {

    public long parse(String text) {
        if (text == null || text.trim().isEmpty()) return 0;
        String norm = normalizeText(text);

        // 1. Vietnamese compound amount format: "1 triệu 500", "2 triệu 300k", "1tr5", "2tr300"
        long compoundAmt = parseVietnameseCompoundAmount(norm);
        if (compoundAmt > 0) {
            return compoundAmt;
        }

        // 2. Standard unit amount format: "1.5 triệu", "1,5tr", "500k", "20 triệu"
        Matcher mUnit = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(k|nghin|ngan|trieu|tr|m|ty|cu)", Pattern.CASE_INSENSITIVE).matcher(norm);
        if (mUnit.find()) {
            double val = Double.parseDouble(mUnit.group(1).replace(",", "."));
            String unit = mUnit.group(2).toLowerCase();
            if (unit.equals("k") || unit.contains("nghin") || unit.contains("ngan")) {
                return (long) (val * 1000L);
            }
            if (unit.equals("ty") || unit.equals("tỷ")) {
                return (long) (val * 1000000000L);
            }
            return (long) (val * 1000000L);
        }

        // 3. Raw number format with thousand separators (e.g. "25.000.000")
        Matcher mRaw = Pattern.compile("(\\d{1,3}(?:[.,]\\d{3})+)", Pattern.CASE_INSENSITIVE).matcher(norm);
        if (mRaw.find()) {
            String clean = mRaw.group(1).replaceAll("[.,]", "");
            return Long.parseLong(clean);
        }

        return 0;
    }

    public long parseVietnameseCompoundAmount(String normText) {
        if (normText == null || normText.isEmpty()) return 0;

        Matcher mFull = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(?:trieu|tr)\\s*(\\d+(?:[.,]\\d+)?)\\s*(?:nghin|ngan|k|tr|trieu)?", Pattern.CASE_INSENSITIVE).matcher(normText);
        if (mFull.find()) {
            double mil = Double.parseDouble(mFull.group(1).replace(",", "."));
            double thousand = Double.parseDouble(mFull.group(2).replace(",", "."));

            if (thousand < 10) {
                thousand = thousand * 100;
            } else if (thousand < 100) {
                thousand = thousand * 10;
            }

            return (long) (mil * 1000000L + thousand * 1000L);
        }

        return 0;
    }

    public long parseTargetAmount(String text) {
        if (text == null || text.trim().isEmpty()) return 0;
        String norm = normalizeText(text);

        // Explicit purchase target snippet matcher
        Pattern pattern = Pattern.compile("(?:mua|sam|mua sam|tiet kiem|tich luy|muon co|can co|tri gia|gia)\\s+.*?(\\d+(?:[.,]\\d+)?\\s*(?:trieu|tr)?\\s*\\d*)\\s*(k|nghin|ngan|trieu|tr|m|ty|cu)?", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(norm);

        if (matcher.find()) {
            String targetSnippet = matcher.group(0);
            long compound = parseVietnameseCompoundAmount(targetSnippet);
            if (compound > 0) return compound;
            return parse(targetSnippet);
        }

        return 0;
    }

    public long parseUserDeclaredBalance(String text) {
        if (text == null || text.trim().isEmpty()) return 0;
        String norm = normalizeText(text);

        Pattern pattern = Pattern.compile("(?:dang co|co san|von|dang giu|hien co|co|hien tai co|hien tai toi co|hien toi co|toi co)\\s+(\\d+(?:[.,]\\d+)?\\s*(?:trieu|tr)?\\s*\\d*)\\s*(k|nghin|ngan|trieu|tr|m|ty|cu)?", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(norm);

        if (matcher.find()) {
            String balSnippet = matcher.group(0);
            long compound = parseVietnameseCompoundAmount(balSnippet);
            if (compound > 0) return compound;
            return parse(balSnippet);
        }

        return 0;
    }

    public long parseEmergencyFund(String text) {
        if (text == null || text.trim().isEmpty()) return 0;
        String norm = normalizeText(text);

        // Pattern 1: keyword BEFORE amount (e.g. "giữ lại 10 triệu", "quỹ dự phòng 10 triệu")
        Pattern pattern1 = Pattern.compile("(?:giu lai|trich|lam|de|du phong|du phong rui ro|du phong tai chinh|quy du phong)\\s+(\\d+(?:[.,]\\d+)?\\s*(?:trieu|tr)?\\s*\\d*)\\s*(k|nghin|ngan|trieu|tr|m|ty|cu)?", Pattern.CASE_INSENSITIVE);
        Matcher matcher1 = pattern1.matcher(norm);

        if (matcher1.find()) {
            String fundSnippet = matcher1.group(0);
            long compound = parseVietnameseCompoundAmount(fundSnippet);
            if (compound > 0) return compound;
            long val = parse(fundSnippet);
            if (val > 0) return val;
        }

        // Pattern 2: amount BEFORE keyword (e.g. "10 triệu làm quỹ dự phòng", "10 triệu dự phòng")
        Pattern pattern2 = Pattern.compile("(\\d+(?:[.,]\\d+)?\\s*(?:trieu|tr)?\\s*\\d*)\\s*(k|nghin|ngan|trieu|tr|m|ty|cu)?\\s*(?:lam|de|cho)?\\s*(?:quy\\s*)?du\\s*phong", Pattern.CASE_INSENSITIVE);
        Matcher matcher2 = pattern2.matcher(norm);

        if (matcher2.find()) {
            String fundSnippet = matcher2.group(0);
            long compound = parseVietnameseCompoundAmount(fundSnippet);
            if (compound > 0) return compound;
            return parse(fundSnippet);
        }

        return 0;
    }

    public boolean isMonthlySavingStatement(String text) {
        if (text == null || text.trim().isEmpty()) return false;
        String norm = normalizeText(text);

        Pattern p1 = Pattern.compile("(?:moi\\s*thang|hang\\s*thang|/\\s*thang)\\s+.*?\\d+(?:[.,]\\d+)?\\s*(k|nghin|ngan|trieu|tr|m|ty)", Pattern.CASE_INSENSITIVE);
        Pattern p2 = Pattern.compile("(?:tiet\\s*kiem|de\\s*danh|danh\\s*ra|tich\\s*luy)\\s+.*?\\d+(?:[.,]\\d+)?\\s*(k|nghin|ngan|trieu|tr|m|ty)\\s+.*?(?:moi\\s*thang|hang\\s*thang|/\\s*thang)", Pattern.CASE_INSENSITIVE);
        Pattern p3 = Pattern.compile("(?:tiet\\s*kiem|de\\s*danh|danh\\s*ra|tich\\s*luy)\\s+\\d+(?:[.,]\\d+)?\\s*(k|nghin|ngan|trieu|tr|m|ty)\\s+(?:moi\\s*thang|hang\\s*thang|/\\s*thang|thang)", Pattern.CASE_INSENSITIVE);

        return p1.matcher(norm).find() || p2.matcher(norm).find() || p3.matcher(norm).find();
    }

    public long parseTargetAmountFromHistory(List<ChatMessageHistoryDto> history) {
        if (history == null || history.isEmpty()) return 0;

        // Pass 1: Look for explicit goal target amount pattern (e.g. "mua ô tô 300 triệu") from latest to oldest
        for (int i = history.size() - 1; i >= 0; i--) {
            ChatMessageHistoryDto msg = history.get(i);
            if (msg != null && msg.getContent() != null && "user".equalsIgnoreCase(msg.getRole())) {
                long explicitTarget = parseTargetAmount(msg.getContent());
                if (explicitTarget > 0) {
                    return explicitTarget;
                }
            }
        }

        // Pass 2: Fallback to latest user message amount that is NOT a declared balance or emergency fund
        for (int i = history.size() - 1; i >= 0; i--) {
            ChatMessageHistoryDto msg = history.get(i);
            if (msg != null && msg.getContent() != null && "user".equalsIgnoreCase(msg.getRole())) {
                String content = msg.getContent();
                long userBal = parseUserDeclaredBalance(content);
                long fund = parseEmergencyFund(content);
                long rawAmt = parse(content);
                if (rawAmt > 0 && rawAmt != userBal && rawAmt != fund) {
                    return rawAmt;
                }
            }
        }

        return 0;
    }

    public long parseGoalAmount(String currentText, List<ChatMessageHistoryDto> history, boolean isNewGoal, String goalName, long customMonthlySaving) {
        String norm = normalizeText(currentText);

        // RULE 1: If user statement is a monthly saving capacity ("tiết kiệm 15 triệu/tháng"), 15M is NOT the goal target amount!
        if (isMonthlySavingStatement(norm) || customMonthlySaving > 0) {
            return parseTargetAmountFromHistory(history);
        }

        // RULE 2: If current text explicitly contains a goal target amount (e.g., "mua ô tô 500 triệu", "giá 500 triệu")
        long explicitTarget = parseTargetAmount(currentText);
        if (explicitTarget > 0) {
            long userBal = parseUserDeclaredBalance(currentText);
            long fund = parseEmergencyFund(currentText);
            if (explicitTarget != userBal && explicitTarget != fund) {
                return explicitTarget;
            }
        }

        // RULE 3: If it's a NEW goal query, parse amount from current text
        if (isNewGoal) {
            long userBal = parseUserDeclaredBalance(currentText);
            long fund = parseEmergencyFund(currentText);
            long rawAmt = parse(currentText);
            if (rawAmt > 0 && rawAmt != userBal && rawAmt != fund && rawAmt != customMonthlySaving) {
                return rawAmt;
            }
            return rawAmt > 0 ? rawAmt : 0;
        }

        // RULE 4: Follow-up query -> preserve target amount from history!
        return parseTargetAmountFromHistory(history);
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
