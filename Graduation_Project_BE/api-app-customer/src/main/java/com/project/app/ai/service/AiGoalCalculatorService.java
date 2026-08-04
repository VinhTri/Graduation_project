package com.project.app.ai.service;

import com.project.app.ai.dto.internal.GoalContext;
import com.project.app.ai.dto.internal.GoalState;
import com.project.app.ai.dto.internal.ParsedDuration;
import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import com.project.app.ai.parser.AmountParser;
import com.project.app.ai.parser.DurationParser;
import com.project.app.ai.parser.GoalNameParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiGoalCalculatorService {

    private final AmountParser amountParser;
    private final DurationParser durationParser;
    private final GoalNameParser goalNameParser;

    public boolean isNewGoalQuery(String prompt, String goalName) {
        if (prompt == null || prompt.isEmpty()) return false;
        String norm = normalizeText(prompt);

        // Explicit purchase target pattern ("mua ô tô 300 triệu", "mua laptop 25tr", "muốn có 300tr") ALWAYS indicates a new goal creation query
        boolean hasExplicitGoalPurchase = Pattern.compile(
                "(?:mua|sam|muon co|can co|tri gia|dinh mua)\\s+.*?(?:\\d+(?:[.,]\\d+)?\\s*(?:trieu|tr|m|ty)|oto|o to|laptop|xe|nha|iphone)",
                Pattern.CASE_INSENSITIVE
        ).matcher(norm).find();

        if (hasExplicitGoalPurchase) {
            return true;
        }

        boolean isFollowUpPrompt = norm.contains("moi thang") || norm.contains("neu toi") || norm.contains("neu khong dung")
                || norm.contains("giu nguyen") || norm.contains("the la") || norm.contains("vay la") || norm.contains("so sanh")
                || norm.contains("chi tiet kiem") || norm.contains("neu trong") || norm.contains("thi sao")
                || norm.contains("can bao lau") || norm.contains("bao lau") || norm.contains("mat bao lau")
                || norm.contains("rut ngan") || norm.contains("keo dai") || norm.contains("quy du phong")
                || norm.contains("giu lai");

        if (isFollowUpPrompt) {
            return false;
        }

        boolean hasGoalKeyword = norm.contains("mua") || norm.contains("muon co") || norm.contains("tiet kiem") 
                || norm.contains("tich luy") || norm.contains("can co") || norm.contains("dat duoc");
        boolean hasSpecificProduct = !"mục tiêu tài chính".equalsIgnoreCase(goalName);
        boolean hasAmount = amountParser.parse(prompt) > 0;
        return (hasGoalKeyword && (hasAmount || hasSpecificProduct));
    }

    public String findPreviousGoalMessage(List<ChatMessageHistoryDto> history) {
        if (history == null || history.isEmpty()) {
            return "";
        }

        for (int i = history.size() - 1; i >= 0; i--) {
            ChatMessageHistoryDto msg = history.get(i);
            if (msg == null || msg.getContent() == null) {
                continue;
            }

            // Strictly filter USER role only (ignore ASSISTANT/model responses to prevent amount pollution)
            if (msg.getRole() != null && !"user".equalsIgnoreCase(msg.getRole())) {
                continue;
            }

            String content = msg.getContent();
            String norm = normalizeText(content);

            boolean hasGoalKeyword = norm.contains("mua") || norm.contains("tich luy") || norm.contains("tiet kiem") 
                    || norm.contains("muon co") || norm.contains("can co") || norm.contains("dat duoc") || norm.contains("muc tieu");

            boolean hasAmount = amountParser.parse(content) > 0;
            boolean hasDuration = norm.contains("thang") || norm.contains("nam");

            if (hasGoalKeyword && (hasAmount || hasDuration)) {
                return content;
            }
        }

        return "";
    }

    public boolean containsKeepCurrentBalancePhrase(String norm) {
        if (norm == null || norm.isEmpty()) return false;
        return norm.contains("khong muon dung") || norm.contains("khong dung so tien do") || norm.contains("khong su dung so tien do")
                || norm.contains("khong dung so du") || norm.contains("giu nguyen so du") || norm.contains("khong dung so du hien tai")
                || norm.contains("khong su dung so du") || norm.contains("giu lai so tien") || norm.contains("de danh so tien")
                || norm.contains("khong dung") || norm.contains("khong su dung") || norm.contains("giu nguyen");
    }

    public long parseMonthlySavingFromPrompt(String prompt) {
        if (prompt == null || prompt.trim().isEmpty()) return 0;
        String norm = normalizeText(prompt);

        Pattern pattern = Pattern.compile(
                "(?:"
                        + "moi\\s*thang"
                        + "|hang\\s*thang"
                        + "|tiet\\s*kiem"
                        + "|de\\s*danh"
                        + "|danh\\s*ra"
                        + "|tich\\s*luy"
                        + ")"
                        + ".*?"
                        + "(\\d+(?:[.,]\\d+)?)"
                        + "\\s*"
                        + "(k|nghin|ngan|trieu|tr|m|ty)",
                Pattern.CASE_INSENSITIVE
        );

        Matcher matcher = pattern.matcher(norm);
        if (!matcher.find()) return 0;

        double value = Double.parseDouble(matcher.group(1).replace(",", "."));
        String unit = matcher.group(2).toLowerCase();

        switch (unit) {
            case "k":
            case "nghin":
            case "ngan":
                return (long) (value * 1_000L);
            case "trieu":
            case "tr":
            case "m":
                return (long) (value * 1_000_000L);
            case "ty":
                return (long) (value * 1_000_000_000L);
            default:
                return 0;
        }
    }

    public GoalState resolveGoalState(String userPrompt, List<ChatMessageHistoryDto> history, BigDecimal totalBal, boolean isNewGoal) {
        GoalState state = new GoalState();

        // Pass 1: Accumulate state chronologically from history (oldest -> newest) only if NOT a brand new goal
        if (!isNewGoal && history != null) {
            for (ChatMessageHistoryDto msg : history) {
                if (msg != null && msg.getContent() != null && "user".equalsIgnoreCase(msg.getRole())) {
                    applyPromptToState(msg.getContent(), state);
                }
            }
        }

        // Pass 2: Apply current user prompt
        applyPromptToState(userPrompt, state);

        // Fallbacks if goalName/duration are missing:
        if (state.getGoalName() == null || state.getGoalName().isEmpty()) {
            state.setGoalName("mục tiêu tài chính");
        }
        if (state.getDurationMonths() <= 0 && state.getDurationDays() <= 0) {
            state.setDurationMonths(24);
            state.setDurationDays(720);
            state.setDays(false);
            state.setOriginalTimeText("24 tháng");
        }

        return state;
    }

    private void applyPromptToState(String prompt, GoalState state) {
        if (prompt == null || prompt.trim().isEmpty()) return;
        String norm = normalizeText(prompt);

        // 1. Goal Name
        String extractedName = goalNameParser.extractGoalName(prompt, norm);
        if (!"mục tiêu tài chính".equalsIgnoreCase(extractedName) && !"tích lũy".equalsIgnoreCase(extractedName)) {
            state.setGoalName(extractedName);
        }

        // 2. Target Amount (explicit goal target amount)
        long explicitTarget = amountParser.parseTargetAmount(prompt);
        long userBal = amountParser.parseUserDeclaredBalance(prompt);
        long emergencyFund = amountParser.parseEmergencyFund(prompt);
        long monthlySaving = parseMonthlySavingFromPrompt(prompt);

        if (amountParser.isMonthlySavingStatement(norm) || monthlySaving > 0) {
            // Statement specifies monthly saving capacity ("tiết kiệm 15 triệu/tháng") -> DO NOT modify targetAmount!
        } else if (explicitTarget > 0 && explicitTarget != userBal && explicitTarget != emergencyFund) {
            state.setTargetAmount(explicitTarget);
        } else if (state.getTargetAmount() == 0) {
            long rawAmt = amountParser.parse(prompt);
            if (rawAmt > 0 && rawAmt != userBal && rawAmt != emergencyFund && rawAmt != monthlySaving) {
                state.setTargetAmount(rawAmt);
            }
        }

        // 3. Duration Adjustment
        Integer delta = durationParser.extractRelativeMonthDelta(norm);
        if (delta != null) {
            int baseMonths = state.getDurationMonths() > 0 ? state.getDurationMonths() : 24;
            int newMonths = Math.max(1, baseMonths + delta);
            state.setDurationMonths(newMonths);
            state.setDurationDays(newMonths * 30);
            state.setDays(false);
            state.setOriginalTimeText(newMonths + " tháng");
        } else {
            ParsedDuration pd = durationParser.parseDuration(prompt, norm);
            if (pd != null && (pd.getDurationMonths() > 0 || pd.getDurationDays() > 0)) {
                state.setDurationMonths(pd.getDurationMonths());
                state.setDurationDays(pd.getDurationDays());
                state.setDays(pd.isDays());
                if (pd.getOriginalTimeText() != null && !pd.getOriginalTimeText().isEmpty()) {
                    state.setOriginalTimeText(pd.getOriginalTimeText());
                }
            }
        }

        // 4. Declared Balance
        if (userBal > 0) {
            state.setDeclaredBalance(userBal);
        }

        // 5. Emergency Fund
        if (emergencyFund > 0) {
            state.setEmergencyFund(emergencyFund);
        }

        // 6. Custom Monthly Saving Capacity
        if (monthlySaving > 0) {
            state.setMonthlySaving(monthlySaving);
        }

        // 7. Keep Entire Balance Flag
        if (wantsToKeepEntireBalance(norm)) {
            state.setKeepEntireBalance(true);
        }
    }

    public boolean wantsToKeepEntireBalance(String norm) {
        if (norm == null || norm.isEmpty()) return false;
        return norm.contains("khong muon dung so tien do") || norm.contains("khong dung so tien do") || norm.contains("khong su dung so tien do")
                || norm.contains("khong dung so du") || norm.contains("giu nguyen so du") || norm.contains("khong dung so du hien tai")
                || norm.contains("khong su dung so du") || norm.contains("giu nguyen toan bo") || norm.contains("khong dung toi");
    }

    public GoalContext calculate(String userPrompt, List<ChatMessageHistoryDto> history, BigDecimal totalBal) {
        String currentNorm = normalizeText(userPrompt);
        String initialGoalName = goalNameParser.extractGoalName(userPrompt, currentNorm);
        boolean isNewGoal = isNewGoalQuery(userPrompt, initialGoalName);

        GoalState state = resolveGoalState(userPrompt, history, totalBal, isNewGoal);

        if (state.getGoalName() == null || state.getGoalName().isBlank()) {
            state.setGoalName("mục tiêu tài chính");
        }

        long grossBalance = state.getDeclaredBalance() > 0 ? state.getDeclaredBalance() : totalBal.longValue();
        long emergencyFund = Math.max(0, state.getEmergencyFund());
        long balanceForGoal = Math.max(0, grossBalance - emergencyFund);
        long usableBalance = state.isKeepEntireBalance() ? 0 : balanceForGoal;

        long targetAmount = state.getTargetAmount();
        int targetMonths = state.getDurationMonths();
        int targetDays = state.getDurationDays();
        boolean isDays = state.isDays();
        String originalTimeText = state.getOriginalTimeText();

        // Option 1: dùng số dư
        long remainingWithBalance = Math.max(0, targetAmount - balanceForGoal);
        long monthlySavingWithBalance = targetMonths > 0 ? (long) Math.ceil((double) remainingWithBalance / targetMonths) : remainingWithBalance;
        long dailySavingWithBalance = isDays && targetDays > 0 ? (long) Math.ceil((double) remainingWithBalance / targetDays)
                : (targetMonths > 0 ? (long) Math.ceil((double) remainingWithBalance / (targetMonths * 30.0)) : remainingWithBalance);

        // Option 2: không dùng số dư
        long remainingWithoutBalance = targetAmount;
        long monthlySavingWithoutBalance = targetMonths > 0 ? (long) Math.ceil((double) remainingWithoutBalance / targetMonths) : remainingWithoutBalance;
        long dailySavingWithoutBalance = isDays && targetDays > 0 ? (long) Math.ceil((double) remainingWithoutBalance / targetDays)
                : (targetMonths > 0 ? (long) Math.ceil((double) remainingWithoutBalance / (targetMonths * 30.0)) : remainingWithoutBalance);

        // Custom monthly saving capacity (e.g. "nếu chỉ tiết kiệm 15 triệu/tháng")
        long customMonthlySaving = state.getMonthlySaving();
        long projectedAmount = 0;
        long surplusAmount = 0;
        long shortfallAmount = 0;
        boolean isAchievable = true;
        long monthsNeededWithBalance = 0;
        long monthsNeededWithoutBalance = 0;
        long daysNeededWithBalance = 0;
        long daysNeededWithoutBalance = 0;

        if (customMonthlySaving > 0) {
            long startingAmount = state.isKeepEntireBalance() ? 0 : balanceForGoal;
            if (isDays && targetDays > 0) {
                long customDailySaving = (long) Math.ceil((double) customMonthlySaving / 30.0);
                projectedAmount = startingAmount + (customDailySaving * targetDays);
            } else {
                projectedAmount = startingAmount + (customMonthlySaving * targetMonths);
            }

            if (projectedAmount >= targetAmount) {
                surplusAmount = projectedAmount - targetAmount;
                shortfallAmount = 0;
                isAchievable = true;
            } else {
                shortfallAmount = targetAmount - projectedAmount;
                surplusAmount = 0;
                isAchievable = false;
            }

            monthsNeededWithBalance = (long) Math.ceil((double) remainingWithBalance / customMonthlySaving);
            monthsNeededWithoutBalance = (long) Math.ceil((double) targetAmount / customMonthlySaving);

            long customDailySaving = Math.max(1, (long) Math.ceil((double) customMonthlySaving / 30.0));
            daysNeededWithBalance = (long) Math.ceil((double) remainingWithBalance / customDailySaving);
            daysNeededWithoutBalance = (long) Math.ceil((double) targetAmount / customDailySaving);
        }

        long activeRemaining = state.isKeepEntireBalance() ? remainingWithoutBalance : remainingWithBalance;

        log.info("===== GOAL CALCULATION STATE DEBUG =====");
        log.info("userPrompt = {}", userPrompt);
        log.info("isNewGoal = {}", isNewGoal);
        log.info("goalName = {}", state.getGoalName());
        log.info("targetAmount = {}", targetAmount);
        log.info("durationMonths = {}", targetMonths);
        log.info("durationDays = {}", targetDays);
        log.info("isDays = {}", isDays);
        log.info("originalTimeText = {}", originalTimeText);
        log.info("grossBalance = {}", grossBalance);
        log.info("balanceForGoal = {}", balanceForGoal);
        log.info("usableBalance = {}", usableBalance);
        log.info("monthlySavingWithBalance = {}", monthlySavingWithBalance);
        log.info("monthlySavingWithoutBalance = {}", monthlySavingWithoutBalance);
        log.info("customMonthlySaving = {}", customMonthlySaving);
        log.info("projectedAmount = {}", projectedAmount);
        log.info("surplusAmount = {}", surplusAmount);
        log.info("shortfallAmount = {}", shortfallAmount);
        log.info("isAchievable = {}", isAchievable);
        log.info("=========================================");

        return GoalContext.builder()
                .goalName(state.getGoalName())
                .targetAmount(targetAmount)
                .durationMonths(targetMonths)
                .durationDays(targetDays)
                .isDays(isDays)
                .originalTimeText(originalTimeText)
                .currentBalance(BigDecimal.valueOf(grossBalance))
                .userDeclaredBalance(state.getDeclaredBalance())
                .emergencyFund(emergencyFund)
                .usableBalance(usableBalance)
                .useCurrentBalance(!state.isKeepEntireBalance())
                .remainingAmount(activeRemaining)
                .monthlySavingWithBalance(monthlySavingWithBalance)
                .dailySavingWithBalance(dailySavingWithBalance)
                .monthlySavingWithoutBalance(monthlySavingWithoutBalance)
                .dailySavingWithoutBalance(dailySavingWithoutBalance)
                .customMonthlySaving(customMonthlySaving)
                .monthsNeededWithBalance(monthsNeededWithBalance)
                .monthsNeededWithoutBalance(monthsNeededWithoutBalance)
                .daysNeededWithBalance(daysNeededWithBalance)
                .daysNeededWithoutBalance(daysNeededWithoutBalance)
                .projectedAmount(projectedAmount)
                .surplusAmount(surplusAmount)
                .shortfallAmount(shortfallAmount)
                .isAchievable(isAchievable)
                .isNewGoal(isNewGoal)
                .isGoalQuery(true)
                .build();
    }

    public String buildBusinessDataPrompt(GoalContext goalContext, DecimalFormat df) {
        if (goalContext == null || !goalContext.isGoalQuery()) {
            return "";
        }

        String durationDisplayInfo;
        if (goalContext.isDays()) {
            durationDisplayInfo = String.format("DURATION_DISPLAY = \"%s\" (TUYỆT ĐỐI GIỮ NGUYÊN CỤM NÀY KHI MÔ TẢ MỤC TIÊU NGƯỜI DÙNG)\nDURATION_CALCULATION = %d ngày",
                    goalContext.getOriginalTimeText() != null ? goalContext.getOriginalTimeText() : goalContext.getDurationDays() + " ngày",
                    goalContext.getDurationDays());
        } else {
            durationDisplayInfo = String.format("DURATION_DISPLAY = \"%s\" (TUYỆT ĐỐI GIỮ NGUYÊN CỤM NÀY KHI MÔ TẢ MỤC TIÊU NGƯỜI DÙNG)\nDURATION_CALCULATION = %d tháng",
                    goalContext.getOriginalTimeText() != null ? goalContext.getOriginalTimeText() : goalContext.getDurationMonths() + " tháng",
                    goalContext.getDurationMonths());
        }

        String customSavingInfo = "";
        if (goalContext.getCustomMonthlySaving() > 0) {
            customSavingInfo = String.format(
                "\n- KỊCH BẢN NGƯỜI DÙNG CHỈ TIẾT KIỆM: %s VNĐ/tháng\n" +
                "  + Vốn ban đầu được sử dụng cho mục tiêu: %s VNĐ\n" +
                "  + Tiết kiệm hàng tháng: %s VNĐ × %d tháng = %s VNĐ\n" +
                "  + Tổng tiền tạo ra cho mục tiêu: %s VNĐ (Mục tiêu: %s VNĐ)\n" +
                "  + Kết quả: %s (Dư: %s VNĐ | Thiếu: %s VNĐ)\n" +
                "  + Thời gian hoàn thành (Nếu dùng vốn khả dụng): %d tháng\n" +
                "  + Thời gian hoàn thành (Nếu không dùng vốn khả dụng): %d tháng\n",
                df.format(goalContext.getCustomMonthlySaving()),
                df.format(goalContext.getUsableBalance()),
                df.format(goalContext.getCustomMonthlySaving()),
                goalContext.getDurationMonths(),
                df.format(goalContext.getCustomMonthlySaving() * goalContext.getDurationMonths()),
                df.format(goalContext.getProjectedAmount()),
                df.format(goalContext.getTargetAmount()),
                goalContext.isAchievable() ? "ĐỦ ĐẠT MỤC TIÊU" : "KHÔNG ĐỦ ĐẠT MỤC TIÊU",
                df.format(goalContext.getSurplusAmount()),
                df.format(goalContext.getShortfallAmount()),
                goalContext.getMonthsNeededWithBalance(),
                goalContext.getMonthsNeededWithoutBalance()
            );
        }

        String method1Text = goalContext.isDays() ?
            String.format("Phương án 1 - Sử dụng vốn khả dụng (%s VNĐ): Tiết kiệm khoảng %s VNĐ/ngày trong %d ngày",
                df.format(goalContext.getUsableBalance()), df.format(goalContext.getDailySavingWithBalance()), goalContext.getDurationDays()) :
            String.format("Phương án 1 - Sử dụng vốn khả dụng (%s VNĐ): Tiết kiệm khoảng %s VNĐ/tháng trong %d tháng",
                df.format(goalContext.getUsableBalance()), df.format(goalContext.getMonthlySavingWithBalance()), goalContext.getDurationMonths());

        String method2Text = goalContext.isDays() ?
            String.format("Phương án 2 - Giữ nguyên số dư hiện tại (%s VNĐ): Tiết kiệm khoảng %s VNĐ/ngày trong %d ngày",
                df.format(goalContext.getCurrentBalance()), df.format(goalContext.getDailySavingWithoutBalance()), goalContext.getDurationDays()) :
            String.format("Phương án 2 - Giữ nguyên số dư hiện tại (%s VNĐ): Tiết kiệm khoảng %s VNĐ/tháng trong %d tháng",
                df.format(goalContext.getCurrentBalance()), df.format(goalContext.getMonthlySavingWithoutBalance()), goalContext.getDurationMonths());

        return String.format(
            "\n3. BUSINESS DATA - SỐ LIỆU ĐÃ ĐƯỢC BACKEND TÍNH TOÁN CHÍNH XÁC\n" +
            "Mục tiêu tài chính: %s\n" +
            "TARGET_AMOUNT = %s VNĐ\n" +
            "USER_DECLARED_BALANCE = %s VNĐ\n" +
            "EMERGENCY_FUND = %s VNĐ\n" +
            "USABLE_BALANCE = %s VNĐ\n" +
            "%s\n" +
            "%s\n" +
            "%s\n" +
            "%s",
            goalContext.getGoalName(),
            df.format(goalContext.getTargetAmount()),
            df.format(goalContext.getCurrentBalance()),
            df.format(goalContext.getEmergencyFund()),
            df.format(goalContext.getUsableBalance()),
            durationDisplayInfo,
            method1Text,
            method2Text,
            customSavingInfo
        );
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
