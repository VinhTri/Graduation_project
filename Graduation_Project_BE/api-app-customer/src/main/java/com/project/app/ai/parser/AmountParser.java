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

        // 4. Plain number format without separators (e.g. "3000000", "25000000")
        Matcher mPlain = Pattern.compile("\\b(\\d{4,12})\\b").matcher(norm);
        if (mPlain.find()) {
            return Long.parseLong(mPlain.group(1));
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

    public String parseGoalName(String text) {
        if (text == null || text.trim().isEmpty()) return null;
        String norm = normalizeText(text);

        Pattern pattern = Pattern.compile("(?:mua|sam|mua sam|tiet kiem mua)\\s+([a-z0-9\\s]{1,20}?)(?=\\s+\\d|\\s+tr|\\s+trieu|\\s+trong|\\s+sau|\\s+$)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(norm);
        if (matcher.find()) {
            String name = matcher.group(1).trim();
            if (!name.isEmpty() && !name.equals("muc tieu")) {
                return name;
            }
        }

        if (norm.contains("tivi") || norm.contains("tv")) return "tivi";
        if (norm.contains("laptop") || norm.contains("may tinh")) return "laptop";
        if (norm.contains("oto") || norm.contains("o to")) return "ô tô";
        if (norm.contains("xe may") || norm.contains("sh") || norm.contains("vespa")) return "xe máy";
        if (norm.contains("nha") || norm.contains("chung cu")) return "nhà";
        if (norm.contains("iphone") || norm.contains("dien thoai") || norm.contains("dt")) return "điện thoại";

        return null;
    }

    public long parseTargetAmount(String text) {
        if (text == null || text.trim().isEmpty()) return 0;
        if (isMonthlySavingStatement(text)) {
            return 0; // MUST EXCLUDE monthly saving capacity statements!
        }
        String norm = normalizeText(text);

        // Explicit purchase target snippet matcher
        Pattern pattern = Pattern.compile("(?:mua|sam|mua sam|tiet kiem|tich luy|muon co|can co|tri gia|gia)\\s+.*?(\\d{1,3}(?:[.,]\\d{3})+|\\d+(?:[.,]\\d+)?(?:\\s*(?:trieu|tr))?\\s*\\d*)\\s*(k|nghin|ngan|trieu|tr|m|ty|cu)?", Pattern.CASE_INSENSITIVE);
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

        String cleanNorm = norm.replaceAll("(?:muon|can|dinh|du dinh)\\s+co", "")
                .replaceAll("(?:tiet kiem|tich luy|mua|sam|mua sam)\\s+.*?\\d+(?:[.,]\\d+)?\\s*(?:trieu|tr|k|nghin|ngan|m|ty|cu)?", "");

        Pattern pattern = Pattern.compile(
                "(?:" +
                        "so\\s*du(?:\\s*hien\\s*tai)?(?:\\s*la|\\s*chi\\s*la|\\s*co|\\s*bang|\\s*con|\\s*khoang)?" +
                        "|neu(?:\\s*toi)?(?:\\s*chi)?(?:\\s*la|\\s*co|\\s*dang\\s*co|\\s*hien\\s*co|\\s*so\\s*du(?:\\s*hien\\s*tai)?(?:\\s*la|\\s*co|\\s*bang|\\s*con)?)" +
                        "|so\\s*tien(?:\\s*hien\\s*co|\\s*co|\\s*dang\\s*co|\\s*hien\\s*tai\\s*la)?" +
                        "|hien\\s*tai\\s*toi\\s*co|hien\\s*toi\\s*co|hien\\s*tai\\s*co|hien\\s*co|toi\\s*co|dang\\s*co|co\\s*san" +
                        "|von(?:\\s*hien\\s*tai)?(?:\\s*la|\\s*co)?" +
                        "|dang\\s*giu|(?:vi|tai\\s*khoan)(?:\\s*hien\\s*tai)?(?:\\s*co|\\s*la)?" +
                        "|luong(?:\\s*toi|\\s*hang\\s*thang)?(?:\\s*la|\\s*duoc|\\s*co|\\s*duoc|\\s*nhan)?" +
                        "|thu\\s*nhap(?:\\s*toi|\\s*hang\\s*thang)?(?:\\s*la|\\s*duoc|\\s*co)?" +
                        "|kiem(?:\\s*duoc)?" +
                ")" +
                "\\s+" +
                "(\\d{1,3}(?:[.,]\\d{3})+|\\d+(?:[.,]\\d+)?(?:\\s*(?:trieu|tr))?\\s*\\d*)\\s*(k|nghin|ngan|trieu|tr|m|ty|cu)?",
                Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = pattern.matcher(cleanNorm);

        if (matcher.find()) {
            String balSnippet = matcher.group(0);
            long compound = parseVietnameseCompoundAmount(balSnippet);
            if (compound > 0) return compound;
            return parse(balSnippet);
        }

        return 0;
    }

    public long parseFixedExpense(String text) {
        if (text == null || text.trim().isEmpty()) return 0;
        String norm = normalizeText(text);

        Pattern p1 = Pattern.compile("(?:tien thue|tien nha|thue nha|phong tro|thue phong|chi phi co dinh)(?:\\s+khoang|\\s+tam|\\s+la)?\\s+(\\d+(?:[.,]\\d+)?\\s*(?:trieu|tr)?\\s*\\d*)\\s*(k|nghin|ngan|trieu|tr|m|ty|cu)?", Pattern.CASE_INSENSITIVE);
        Matcher m1 = p1.matcher(norm);
        if (m1.find()) {
            String snippet = m1.group(0);
            long compound = parseVietnameseCompoundAmount(snippet);
            if (compound > 0) return compound;
            return parse(snippet);
        }

        Pattern p2 = Pattern.compile("(\\d+(?:[.,]\\d+)?\\s*(?:trieu|tr)?\\s*\\d*)\\s*(k|nghin|ngan|trieu|tr|m|ty|cu)?\\s*(?:tien thue|tien nha|thue nha|phong tro|thue phong|chi phi co dinh)", Pattern.CASE_INSENSITIVE);
        Matcher m2 = p2.matcher(norm);
        if (m2.find()) {
            String snippet = m2.group(0);
            long compound = parseVietnameseCompoundAmount(snippet);
            if (compound > 0) return compound;
            return parse(snippet);
        }

        return 0;
    }

    public long parseEmergencyFund(String text) {
        if (text == null || text.trim().isEmpty()) return 0;
        String norm = normalizeText(text);

        Pattern pattern1 = Pattern.compile("(?:giu lai|trich|lam|de|du phong|du phong rui ro|du phong tai chinh|quy du phong)\\s+(\\d+(?:[.,]\\d+)?\\s*(?:trieu|tr)?\\s*\\d*)\\s*(k|nghin|ngan|trieu|tr|m|ty|cu)?", Pattern.CASE_INSENSITIVE);
        Matcher matcher1 = pattern1.matcher(norm);

        if (matcher1.find()) {
            String fundSnippet = matcher1.group(0);
            long compound = parseVietnameseCompoundAmount(fundSnippet);
            if (compound > 0) return compound;
            long val = parse(fundSnippet);
            if (val > 0) return val;
        }

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

    public long parseActualExpense(String text) {
        if (text == null || text.trim().isEmpty()) return 0;
        String norm = normalizeText(text);

        Pattern pExpense = Pattern.compile("(?:chi|tieu|chi tieu|chi phi|tieu het|chi het)(?:\\s+khoang|\\s+tam)?\\s+(\\d+(?:[.,]\\d+)?\\s*(?:trieu|tr)?\\s*\\d*)\\s*(k|nghin|ngan|trieu|tr|m|ty|cu)?", Pattern.CASE_INSENSITIVE);
        Matcher mExpense = pExpense.matcher(norm);

        if (mExpense.find()) {
            String snippet = mExpense.group(0);
            long compound = parseVietnameseCompoundAmount(snippet);
            if (compound > 0) return compound;
            return parse(snippet);
        }
        return 0;
    }

    public boolean isMonthlySavingStatement(String text) {
        if (text == null || text.trim().isEmpty()) return false;
        String norm = normalizeText(text);

        // Questions asking "bao nhiêu", "như thế nào" without a declared saving amount are NOT monthly saving statements
        if ((norm.contains("bao nhieu") || norm.contains("nhu the nao")) && !norm.contains("15") && !norm.contains("10") && !norm.contains("12") && !norm.contains("5") && !norm.contains("20") && !norm.contains("trieu")) {
            return false;
        }

        // Pattern 1: Monthly phrase accompanied by a numeric amount (e.g., "mỗi tháng 15 triệu", "15M/tháng", "tiết kiệm 12tr hàng tháng")
        Pattern p1 = Pattern.compile("(?:moi\\s*thang|hang\\s*thang|/\\s*thang|/\\s*m)\\s+.*?\\d+(?:[.,]\\d+)?\\s*(k|nghin|ngan|trieu|tr|m|ty)", Pattern.CASE_INSENSITIVE);
        if (p1.matcher(norm).find()) {
            return true;
        }

        // Pattern 2: "tiết kiệm 15 triệu/tháng", "chỉ tiết kiệm 15 triệu", "dành ra 10tr mỗi tháng"
        Pattern p2 = Pattern.compile("(?:tiet\\s*kiem|de\\s*danh|danh\\s*ra|tich\\s*luy)\\s+(?:duoc\\s+|chi\\s+)?\\d+(?:[.,]\\d+)?\\s*(k|nghin|ngan|trieu|tr|m|ty)?", Pattern.CASE_INSENSITIVE);
        Matcher m2 = p2.matcher(norm);
        if (m2.find()) {
            if (!norm.contains("trong ") && !norm.contains("sau ") && !norm.contains("truoc ")) {
                return true;
            }
            if (norm.contains("moi thang") || norm.contains("hang thang") || norm.contains("/thang") || norm.contains("/m") || norm.contains("thang")) {
                return true;
            }
        }

        return false;
    }

    public Boolean parseUseCurrentBalance(String text) {
        if (text == null || text.trim().isEmpty()) return null;
        String norm = normalizeText(text);

        if (norm.contains("khong dung so du")
                || norm.contains("khong su dung so du")
                || norm.contains("khong dung tien hien co")
                || norm.contains("giu nguyen so du")
                || norm.contains("khong dung tien dang co")
                || norm.contains("khong tinh so du")
                || norm.contains("khong tru so du")
                || norm.contains("khong tru vao so du")) {
            return false;
        }

        if (norm.contains("co dung so du")
                || norm.contains("dung so du")
                || norm.contains("su dung so du")
                || norm.contains("tru so du")
                || norm.contains("tru vao so du")) {
            return true;
        }

        return null;
    }

    public long parseTargetAmountFromHistory(List<ChatMessageHistoryDto> history) {
        if (history == null || history.isEmpty()) return 0;

        for (int i = history.size() - 1; i >= 0; i--) {
            ChatMessageHistoryDto msg = history.get(i);
            if (msg != null && msg.getContent() != null && "user".equalsIgnoreCase(msg.getRole())) {
                long explicitTarget = parseTargetAmount(msg.getContent());
                if (explicitTarget > 0) {
                    return explicitTarget;
                }
            }
        }
        return 0;
    }

    public long parseGoalAmount(String currentText, List<ChatMessageHistoryDto> history, boolean isNewGoal, String goalName, long customMonthlySaving) {
        String norm = normalizeText(currentText);

        if (isMonthlySavingStatement(norm) || customMonthlySaving > 0) {
            return parseTargetAmountFromHistory(history);
        }

        long explicitTarget = parseTargetAmount(currentText);
        if (explicitTarget > 0) {
            long userBal = parseUserDeclaredBalance(currentText);
            long fund = parseEmergencyFund(currentText);
            if (explicitTarget != userBal && explicitTarget != fund) {
                return explicitTarget;
            }
        }

        if (isNewGoal) {
            long userBal = parseUserDeclaredBalance(currentText);
            long fund = parseEmergencyFund(currentText);
            long rawAmt = parse(currentText);
            if (rawAmt > 0 && rawAmt != userBal && rawAmt != fund && rawAmt != customMonthlySaving && !isMonthlySavingStatement(currentText)) {
                return rawAmt;
            }
            return rawAmt > 0 ? rawAmt : 0;
        }

        return parseTargetAmountFromHistory(history);
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        String clean = com.project.app.ai.util.TextNormalizer.normalizeWhitespace(text);
        return clean.toLowerCase()
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
