package com.project.app.ai.service.impl;

import com.project.app.ai.client.GeminiClient;
import com.project.app.ai.dto.internal.GoalContext;
import com.project.app.ai.dto.request.AiChatRequest;
import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import com.project.app.ai.dto.response.*;
import com.project.app.ai.parser.GoalNameParser;
import com.project.app.ai.service.*;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private final AiContextService aiContextService;
    private final AiIntentService aiIntentService;
    private final AiGoalCalculatorService aiGoalCalculatorService;
    private final AiPromptService aiPromptService;
    private final GeminiClient geminiClient;
    private final GoalNameParser goalNameParser;

    @Override
    public AiChatResponse processChat(User user, AiChatRequest request) {
        String rawMessage = request != null && request.getMessage() != null ? request.getMessage() : "";
        String userPrompt = rawMessage.trim();
        if (request != null) {
            request.setMessage(userPrompt);
        }

        List<ChatMessageHistoryDto> history = request != null ? request.getHistory() : null;
        if (history != null) {
            for (ChatMessageHistoryDto msg : history) {
                if (msg != null && msg.getContent() != null) {
                    msg.setContent(msg.getContent().trim());
                }
            }
        }
        String normalized = normalizeText(userPrompt);

        // Handle numeric menu selection shortcuts (1, 2, 3)
        if ("1".equals(normalized)) {
            userPrompt = "Hướng dẫn sử dụng ứng dụng (Ngân sách, Nạp/Rút tiền, Danh mục, Tạo ví, Quên PIN)";
            normalized = normalizeText(userPrompt);
        } else if ("2".equals(normalized)) {
            userPrompt = "Phân tích chi tiết thu chi cá nhân hiện tại";
            normalized = normalizeText(userPrompt);
        } else if ("3".equals(normalized)) {
            userPrompt = "Tư vấn lập ngân sách & lộ trình tiết kiệm mục tiêu";
            normalized = normalizeText(userPrompt);
        }

        // 1. Intent Classification
        boolean hasHistory = history != null && !history.isEmpty();
        boolean hasPreviousGoal = hasHistory && !aiGoalCalculatorService.findPreviousGoalMessage(history).isEmpty();

        boolean containsGoalContextUpdate =
                normalized.matches(".*\\b\\d+(?:[.,]\\d+)?\\s*(trieu|tr|m|nghin|k)\\b.*")
                        && (
                            normalized.contains("hien tai toi co")
                            || normalized.contains("hien toi co")
                            || normalized.contains("toi co")
                            || normalized.contains("dang co")
                            || normalized.contains("so du")
                            || normalized.contains("giu lai")
                            || normalized.contains("quy du phong")
                            || normalized.contains("tiet kiem duoc")
                            || normalized.contains("moi thang")
                            || normalized.contains("hang thang")
                            || normalized.contains("von")
                        );

        String initialGoalName = goalNameParser.extractGoalName(userPrompt, normalized);
        boolean isNewGoal = aiGoalCalculatorService.isNewGoalQuery(userPrompt, initialGoalName);

        boolean isGoalFollowUp = !isNewGoal && isFinancialGoalFollowUp(normalized);
        boolean isFollowUp = !isNewGoal && hasHistory && (aiIntentService.isFollowUpQueryPrompt(normalized) || containsGoalContextUpdate || isGoalFollowUp);

        String moduleType = aiIntentService.classifyIntent(normalized, history);

        // Override Intent if user is creating a new goal or following up
        if (isNewGoal) {
            moduleType = "FINANCIAL_GOAL";
            isFollowUp = false;
        } else if (hasPreviousGoal && (isFollowUp || containsGoalContextUpdate || isGoalFollowUp)) {
            moduleType = "FINANCIAL_GOAL";
            isFollowUp = true;
        }

        log.info("===== AI DEBUG =====");
        log.info("userPrompt = {}", userPrompt);
        log.info("normalized = {}", normalized);
        log.info("moduleType = {}", moduleType);
        log.info("isFollowUp = {}", isFollowUp);
        log.info("hasPreviousGoal = {}", hasPreviousGoal);
        log.info("containsGoalContextUpdate = {}", containsGoalContextUpdate);
        log.info("isGoalFollowUp = {}", isGoalFollowUp);
        log.info("history size = {}", history != null ? history.size() : 0);
        log.info("====================");

        // Aggregate Context
        Map<String, Object> userContext = aiContextService.fetchUserAccountContext(user);
        BigDecimal totalBal = (BigDecimal) userContext.get("totalBalance");

        GoalContext goalContext = null;
        if ("FINANCIAL_GOAL".equalsIgnoreCase(moduleType)) {
            goalContext = aiGoalCalculatorService.calculate(userPrompt, history, totalBal);
        }

        boolean isBudgetQuery = isBudgetPlanningQuery(normalized);
        if (isBudgetQuery && !hasPreviousGoal) {
            moduleType = "RECOMMENDATION";
        }

        // 4. Handle ANALYTICS queries directly using authoritative DB context data (0ms latency, 100% data accuracy)
        if ("ANALYTICS".equalsIgnoreCase(moduleType)) {
            String aiText = buildAnalyticsResponse(userPrompt, userContext);
            List<AiCardDto> cards = generateCards(moduleType, normalized, userPrompt, userContext);
            AiActionPromptDto actionPrompt = generateActionPrompt(moduleType, normalized, userPrompt);

            return AiChatResponse.builder()
                    .id(UUID.randomUUID().toString())
                    .text(aiText)
                    .moduleType(moduleType)
                    .timestamp(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")))
                    .cards(cards)
                    .actionPrompt(actionPrompt)
                    .build();
        }

        // 5. Handle RECOMMENDATION (Budget Planning) queries directly using calculated business allocation data
        if ("RECOMMENDATION".equalsIgnoreCase(moduleType) || isBudgetQuery) {
            String aiText = buildBudgetRecommendationResponse(userPrompt, userContext);
            List<AiCardDto> cards = generateCards("RECOMMENDATION", normalized, userPrompt, userContext);
            AiActionPromptDto actionPrompt = generateActionPrompt("RECOMMENDATION", normalized, userPrompt);

            return AiChatResponse.builder()
                    .id(UUID.randomUUID().toString())
                    .text(aiText)
                    .moduleType("RECOMMENDATION")
                    .timestamp(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")))
                    .cards(cards)
                    .actionPrompt(actionPrompt)
                    .build();
        }

        // 6. Handle APP_GUIDE queries directly using rich step-by-step knowledge base
        if ("APP_GUIDE".equalsIgnoreCase(moduleType) || aiIntentService.isAppGuideQueryPrompt(normalized)) {
            String aiText = buildAppGuideResponse(normalized);
            List<AiCardDto> cards = generateCards("APP_GUIDE", normalized, userPrompt, userContext);
            AiActionPromptDto actionPrompt = generateActionPrompt("APP_GUIDE", normalized, userPrompt);

            return AiChatResponse.builder()
                    .id(UUID.randomUUID().toString())
                    .text(aiText)
                    .moduleType("APP_GUIDE")
                    .timestamp(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")))
                    .cards(cards)
                    .actionPrompt(actionPrompt)
                    .build();
        }

        // 7. Handle ALL FINANCIAL_GOAL queries directly using programmatic business calculation (0ms latency, zero LLM dependency, 100% data accuracy)
        if ("FINANCIAL_GOAL".equalsIgnoreCase(moduleType) && goalContext != null && goalContext.isGoalQuery()) {
            String aiText;
            if (isFollowUp) {
                aiText = buildGoalFollowUpResponse(userPrompt, normalized, goalContext, totalBal);
            } else {
                aiText = formatGoalCalculationResponse(goalContext, totalBal);
            }

            List<AiCardDto> cards = generateCards(moduleType, normalized, userPrompt, userContext);
            AiActionPromptDto actionPrompt = generateActionPrompt(moduleType, normalized, userPrompt);

            return AiChatResponse.builder()
                    .id(UUID.randomUUID().toString())
                    .text(aiText)
                    .moduleType(moduleType)
                    .timestamp(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")))
                    .cards(cards)
                    .actionPrompt(actionPrompt)
                    .build();
        }

        try {
            // 5. Construct System Prompt & Call Gemini Client for FINANCIAL_GOAL & RAG queries
            String systemPrompt = aiPromptService.buildSystemPrompt(userContext, userPrompt, goalContext, isFollowUp);
            log.info("System Prompt payload sent to Gemini Client:\n{}", systemPrompt);

            String rawText = geminiClient.callGeminiApi(systemPrompt, userPrompt, history);
            String aiText = sanitizeAiText(rawText, isFollowUp);

            List<AiCardDto> cards = generateCards(moduleType, normalized, userPrompt, userContext);
            AiActionPromptDto actionPrompt = generateActionPrompt(moduleType, normalized, userPrompt);

            return AiChatResponse.builder()
                    .id(UUID.randomUUID().toString())
                    .text(aiText)
                    .moduleType(moduleType)
                    .timestamp(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")))
                    .cards(cards)
                    .actionPrompt(actionPrompt)
                    .build();

        } catch (Exception e) {
            log.warn("Error calling Gemini API client, executing fallback engine: {}", e.getMessage());
            return fallbackLocalEngine(userContext, userPrompt, normalized, moduleType, history, goalContext, isFollowUp);
        }
    }

    private String buildAnalyticsResponse(String userPrompt, Map<String, Object> ctx) {
        DecimalFormat df = new DecimalFormat("#,###");
        String username = (String) ctx.get("username");
        BigDecimal totalSpentMonth = (BigDecimal) ctx.getOrDefault("totalSpentMonth", BigDecimal.ZERO);
        boolean hasExpenseData = Boolean.TRUE.equals(ctx.get("hasExpenseData"));
        String topCategoryName = (String) ctx.get("topCategoryName");
        BigDecimal topCategoryAmount = (BigDecimal) ctx.getOrDefault("topCategoryAmount", BigDecimal.ZERO);
        Double topCategoryPercentage = (Double) ctx.getOrDefault("topCategoryPercentage", 0.0);
        String secondCategoryName = (String) ctx.get("secondCategoryName");
        BigDecimal secondCategoryAmount = (BigDecimal) ctx.getOrDefault("secondCategoryAmount", BigDecimal.ZERO);
        Double secondCategoryPercentage = (Double) ctx.getOrDefault("secondCategoryPercentage", 0.0);

        String normalized = normalizeText(userPrompt);

        // 1. Total monthly expense queries ("Tháng này tôi đã chi bao nhiêu tiền?", "Tôi đã tiêu bao nhiêu tiền?")
        if (normalized.contains("da chi bao nhieu") || normalized.contains("chi bao nhieu") || normalized.contains("tieu bao nhieu")
                || normalized.contains("thang nay toi da chi") || normalized.contains("thang nay da chi") || normalized.contains("thang nay toi tieu")
                || normalized.contains("tong chi") || normalized.contains("tong tien chi")) {

            if (!hasExpenseData) {
                return "📊 Chi tiêu tháng này\n\n" +
                       "Tài khoản của bạn hiện chưa ghi nhận phát sinh giao dịch chi tiêu nào trong tháng này.\n\n" +
                       "Hãy thêm các giao dịch chi tiêu vào SmartSpend để AI có thể phân tích chính xác cho bạn.";
            }

            return String.format(
                "📊 Chi tiêu tháng này\n\n" +
                "Trong tháng này, bạn đã chi tổng cộng **%s VNĐ**.\n\n" +
                "Bạn có thể xem báo cáo chi tiết trên ứng dụng để biết số tiền đã chi theo từng danh mục.",
                df.format(totalSpentMonth)
            );
        }

        // 2. Top spending category queries ("Tôi tiêu nhiều nhất ở đâu?", "Chi vào đâu nhiều nhất?")
        if (normalized.contains("tieu nhieu o dau") || normalized.contains("tieu o dau") || normalized.contains("chi vao dau")) {
            if (!hasExpenseData || topCategoryName == null) {
                return "📊 Phân tích chi tiêu\n\n" +
                       "Tháng này bạn chưa có dữ liệu chi tiêu để phân tích danh mục lớn nhất.";
            }

            return String.format(
                "📊 Phân tích chi tiêu\n\n" +
                "Danh mục bạn chi nhiều nhất trong tháng này là **%s** với **%s VNĐ**, chiếm khoảng **%.1f%%** tổng chi tiêu tháng.",
                topCategoryName, df.format(topCategoryAmount), topCategoryPercentage
            );
        }

        // 3. Cost reduction queries ("Tôi nên cắt giảm khoản chi nào?", "Cắt giảm khoản chi")
        if (normalized.contains("cat giam") || normalized.contains("khoan chi")) {
            if (!hasExpenseData || topCategoryName == null) {
                return "💡 Gợi ý cắt giảm chi tiêu\n\n" +
                       "Tài khoản của bạn hiện chưa ghi nhận phát sinh giao dịch chi tiêu trong tháng này.\n\n" +
                       "Hãy ghi nhận các giao dịch thu chi hàng ngày để AI chỉ ra khoản lãng phí cần cắt giảm.";
            }

            BigDecimal suggestedCut = topCategoryAmount.multiply(new BigDecimal("0.15"));
            String secondText = secondCategoryName != null ? String.format(", đồng thời rà soát thêm danh mục '%s' (%s VNĐ, chiếm %.1f%%)", secondCategoryName, df.format(secondCategoryAmount), secondCategoryPercentage) : "";

            return String.format(
                "💡 Gợi ý cắt giảm\n\n" +
                "Khoản bạn nên ưu tiên xem xét là **%s** vì đây đang là danh mục có mức chi cao nhất: **%s VNĐ** (chiếm %.1f%% tổng chi tiêu).\n\n" +
                "Nếu giảm khoảng 15%% khoản chi này, bạn có thể tiết kiệm khoảng **%s VNĐ/tháng**%s.",
                topCategoryName, df.format(topCategoryAmount), topCategoryPercentage, df.format(suggestedCut), secondText
            );
        }

        // Default Analytics response
        if (!hasExpenseData) {
            return "📊 Chi tiêu tháng này\n\n" +
                   "Tài khoản của bạn hiện chưa ghi nhận phát sinh giao dịch chi tiêu trong tháng này.";
        }

        return String.format(
            "📊 Tổng chi tiêu tháng này của bạn là **%s VNĐ**.",
            df.format(totalSpentMonth)
        );
    }

    private String buildGoalFollowUpResponse(String userPrompt, String normalized, GoalContext goalContext, BigDecimal totalBal) {
        DecimalFormat df = new DecimalFormat("#,###");
        String goalName = goalContext.getGoalName();
        String actionPrefix = goalName.startsWith("tích lũy") ? "" : "mua ";
        long usableBal = goalContext.getUsableBalance();

        // 1. Duration question check ("Cần bao lâu để đạt mục tiêu", "bao lâu", "mất bao lâu")
        boolean asksHowLong = normalized.contains("can bao lau") || normalized.contains("bao lau") || normalized.contains("mat bao lau") || normalized.contains("bao nhieu thang");
        if (asksHowLong && goalContext.getCustomMonthlySaving() > 0) {
            long monthlySaving = goalContext.getCustomMonthlySaving();
            long monthsNeededWithBal = goalContext.getMonthsNeededWithBalance() > 0 ? goalContext.getMonthsNeededWithBalance() : 1;
            long monthsNeededWithoutBal = goalContext.getMonthsNeededWithoutBalance() > 0 ? goalContext.getMonthsNeededWithoutBalance() : 1;

            return String.format(
                "⏱️ **Thời gian cần để đạt mục tiêu**\n\n" +
                "Với khả năng tiết kiệm **%s VNĐ/tháng**:\n\n" +
                "• **Nếu sử dụng vốn khả dụng (%s VNĐ)**: Cần khoảng **%d tháng** (Số tiền còn thiếu: %s VNĐ).\n" +
                "• **Nếu giữ nguyên số dư hiện tại**: Cần khoảng **%d tháng**.\n\n" +
                "🎯 Mục tiêu: %s**%s %s VNĐ**.",
                df.format(monthlySaving),
                df.format(usableBal),
                monthsNeededWithBal,
                df.format(goalContext.getRemainingAmount()),
                monthsNeededWithoutBal,
                actionPrefix,
                goalName,
                df.format(goalContext.getTargetAmount())
            );
        }

        // 2. Custom monthly saving capacity check ("Nếu mỗi tháng tôi chỉ tiết kiệm 2 triệu thì sao? Có đủ không?")
        if (goalContext.getCustomMonthlySaving() > 0) {
            long customAmt = goalContext.getCustomMonthlySaving();
            long monthsWithBal = goalContext.getMonthsNeededWithBalance() > 0 ? goalContext.getMonthsNeededWithBalance() : 1;
            long monthsFull = goalContext.getMonthsNeededWithoutBalance() > 0 ? goalContext.getMonthsNeededWithoutBalance() : 1;

            if (!goalContext.isAchievable()) {
                long neededMonthly = goalContext.getMonthlyGapSaving();
                long gapMonthly = neededMonthly > customAmt ? neededMonthly - customAmt : 0;

                String balNotice;
                if (goalContext.getUserDeclaredBalance() > 0) {
                    if (goalContext.getEmergencyFund() > 0) {
                        balNotice = String.format("• Vốn ban đầu (theo giả định): **%s VNĐ** (Giữ lại **%s VNĐ** làm quỹ dự phòng ➔ Vốn khả dụng: **%s VNĐ**).\n", df.format(goalContext.getUserDeclaredBalance()), df.format(goalContext.getEmergencyFund()), df.format(usableBal));
                    } else {
                        balNotice = String.format("• Vốn ban đầu (theo giả định): **%s VNĐ** (Số dư thực tế trên SmartSpend: **%s VNĐ**).\n", df.format(goalContext.getUserDeclaredBalance()), df.format(totalBal));
                    }
                } else {
                    balNotice = String.format("• Số dư hiện tại: **%s VNĐ**.\n", df.format(totalBal));
                }

                return String.format(
                    "❌ **Chưa đủ để đạt mục tiêu trong %d tháng!**\n\n" +
                    "Mục tiêu: %s**%s %s VNĐ** trong %d tháng.\n" +
                    "%s" +
                    "• Tiết kiệm hàng tháng: **%s VNĐ/tháng** × %d tháng = **%s VNĐ**.\n" +
                    "• Tổng tích lũy dự kiến: **%s VNĐ** (Còn thiếu: **%s VNĐ**).\n\n" +
                    "➡️ **Thời gian thực tế cần thiết**: Bạn cần khoảng **%d tháng** (nếu dùng vốn khả dụng) hoặc **%d tháng** (nếu không dùng vốn khả dụng).\n\n" +
                    "💡 **Giải pháp**: Để đạt mục tiêu đúng %d tháng, bạn cần tiết kiệm khoảng **%s VNĐ/tháng** (tăng thêm **%s VNĐ/tháng**).",
                    goalContext.getDurationMonths(),
                    actionPrefix,
                    goalName,
                    df.format(goalContext.getTargetAmount()),
                    goalContext.getDurationMonths(),
                    balNotice,
                    df.format(customAmt),
                    goalContext.getDurationMonths(),
                    df.format(customAmt * goalContext.getDurationMonths()),
                    df.format(goalContext.getProjectedAmount()),
                    df.format(goalContext.getShortfallAmount()),
                    monthsWithBal,
                    monthsFull,
                    goalContext.getDurationMonths(),
                    df.format(neededMonthly),
                    df.format(gapMonthly)
                );
            } else {
                long surplus = goalContext.getSurplusAmount();
                String surplusText = surplus > 0 ? String.format(" (Dự kiến dư **%s VNĐ**)", df.format(surplus)) : "";

                return String.format(
                    "✅ **Hoàn toàn đủ khả năng đạt mục tiêu!**\n\n" +
                    "Mục tiêu: %s**%s %s VNĐ** trong %d tháng.\n" +
                    "• Khả năng tiết kiệm: **%s VNĐ/tháng**.\n" +
                    "• Tổng tích lũy dự kiến sau %d tháng: **%s VNĐ**%s.\n\n" +
                    "➡️ **Phương án 1 (Sử dụng vốn khả dụng %s VNĐ)**: Bạn sẽ hoàn thành mục tiêu sau khoảng **%d tháng**.\n" +
                    "➡️ **Phương án 2 (Giữ nguyên số dư hiện tại)**: Bạn sẽ hoàn thành mục tiêu sau khoảng **%d tháng**.",
                    actionPrefix,
                    goalName,
                    df.format(goalContext.getTargetAmount()),
                    goalContext.getDurationMonths(),
                    df.format(customAmt),
                    goalContext.getDurationMonths(),
                    df.format(goalContext.getProjectedAmount()),
                    surplusText,
                    df.format(usableBal),
                    monthsWithBal,
                    monthsFull
                );
            }
        }

        // 3. Keep balance option check ("Nếu tôi không dùng số dư hiện tại thì sao?")
        boolean keepCurrentBalance = normalized.contains("khong dung") || normalized.contains("giu nguyen")
                || normalized.contains("khong su dung") || normalized.contains("khong dung so du");

        if (keepCurrentBalance) {
            return String.format(
                "💰 **Nếu không sử dụng số dư hiện tại**\n\n" +
                "Bạn giữ nguyên số dư và không dùng khoản tiền này cho mục tiêu.\n\n" +
                "Để đạt mục tiêu %s**%s %s VNĐ** trong %d tháng, bạn cần tự tiết kiệm khoảng **%s VNĐ/tháng**.",
                actionPrefix,
                goalName,
                df.format(goalContext.getTargetAmount()),
                goalContext.getDurationMonths(),
                df.format(goalContext.getMonthlySaving())
            );
        }

        // 4. Use balance option check ("Nếu sử dụng toàn bộ số dư hiện tại thì sao?")
        boolean useCurrentBalance = normalized.contains("dung so du") || normalized.contains("dung toan bo") || normalized.contains("su dung so du");
        if (useCurrentBalance) {
            long effectiveBal = goalContext.getUserDeclaredBalance() > 0 
                ? Math.max(0, goalContext.getUserDeclaredBalance() - goalContext.getEmergencyFund()) 
                : totalBal.longValue();
            long remGap = Math.max(0, goalContext.getTargetAmount() - effectiveBal);
            long neededMonthly = goalContext.getDurationMonths() > 0 ? Math.round((double) remGap / goalContext.getDurationMonths()) : remGap;

            return String.format(
                "💰 **Nếu sử dụng vốn khả dụng hiện tại**\n\n" +
                "Sử dụng số tiền khả dụng **%s VNĐ**, bạn còn thiếu **%s VNĐ** cho mục tiêu %s**%s %s VNĐ**.\n\n" +
                "➡️ Trong %d tháng, bạn cần tiết kiệm khoảng **%s VNĐ/tháng**.",
                df.format(effectiveBal),
                df.format(remGap),
                actionPrefix,
                goalName,
                df.format(goalContext.getTargetAmount()),
                goalContext.getDurationMonths(),
                df.format(neededMonthly)
            );
        }

        // 5. Explicit declared balance / emergency fund update check
        if (goalContext.getUserDeclaredBalance() > 0 || goalContext.getEmergencyFund() > 0) {
            long declaredBal = goalContext.getUserDeclaredBalance() > 0 ? goalContext.getUserDeclaredBalance() : totalBal.longValue();
            long emergencyFund = goalContext.getEmergencyFund();
            long targetAmt = goalContext.getTargetAmount();
            long remainingGap = goalContext.getRemainingAmount();
            int months = goalContext.getDurationMonths() > 0 ? goalContext.getDurationMonths() : 1;
            long neededMonthly = goalContext.getMonthlyGapSaving();

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("💰 **Cập nhật kế hoạch %s%s %s VNĐ**\n\n", actionPrefix, goalName, df.format(targetAmt)));
            sb.append(String.format("💵 **Số tiền hiện có**: %s VNĐ\n", df.format(declaredBal)));
            if (emergencyFund > 0) {
                sb.append(String.format("🛡️ **Quỹ dự phòng giữ lại**: %s VNĐ\n", df.format(emergencyFund)));
            }
            sb.append(String.format("🎯 **Số tiền có thể dùng cho mục tiêu**: %s VNĐ\n\n", df.format(usableBal)));
            sb.append(String.format("📌 **Số tiền còn thiếu**:\n%s - %s = **%s VNĐ**\n\n", df.format(targetAmt), df.format(usableBal), df.format(remainingGap)));
            sb.append(String.format("➡️ **Để đạt mục tiêu trong %d tháng**:\n", months));
            sb.append(String.format("%s ÷ %d ≈ **%s VNĐ/tháng**.", df.format(remainingGap), months, df.format(neededMonthly)));
            return sb.toString();
        }

        // 6. Rich Follow-up response layout
        long monthlyWithBal = goalContext.getMonthlyGapSaving() > 0 ? goalContext.getMonthlyGapSaving() : goalContext.getMonthlySaving();
        long monthlyWithoutBal = goalContext.getMonthlySaving();
        double roundedMillion = Math.round((double) monthlyWithBal / 10000.0) / 100.0;

        return String.format(
            "🎯 **Kế hoạch %s%s %s VNĐ trong %d tháng**\n\n" +
            "💵 **Số dư hiện tại**: %s VNĐ\n" +
            "📌 **Số tiền còn thiếu**: %s VNĐ\n\n" +
            "➡️ **Phương án 1 (Sử dụng số dư hiện tại)**:\nCần tiết kiệm khoảng **%s VNĐ/tháng** trong %d tháng.\n\n" +
            "➡️ **Phương án 2 (Giữ nguyên số dư hiện tại)**:\nCần tiết kiệm khoảng **%s VNĐ/tháng** trong %d tháng.\n\n" +
            "💡 **Gợi ý**: Bạn nên tiết kiệm khoảng **%.2f triệu VNĐ/tháng** nếu chấp nhận sử dụng số dư hiện tại cho mục tiêu này.",
            actionPrefix,
            goalName,
            df.format(goalContext.getTargetAmount()),
            goalContext.getDurationMonths(),
            df.format(totalBal),
            df.format(goalContext.getRemainingAmount()),
            df.format(monthlyWithBal),
            goalContext.getDurationMonths(),
            df.format(monthlyWithoutBal),
            goalContext.getDurationMonths(),
            roundedMillion
        );
    }

    private String formatGoalCalculationResponse(GoalContext goalContext, BigDecimal dbTotalBal) {
        DecimalFormat df = new DecimalFormat("#,###");
        String goalName = goalContext.getGoalName();
        String actionPrefix = goalName.startsWith("tích lũy") ? "" : "mua ";
        long targetAmt = goalContext.getTargetAmount();
        int months = goalContext.getDurationMonths();

        // 1. If user explicitly specified NOT USING current balance (e.g. "Hiện tôi có 12 triệu nhưng không muốn dùng số tiền đó")
        if (!goalContext.isUseCurrentBalance()) {
            long fullMonthly = months > 0 ? Math.round((double) targetAmt / months) : targetAmt;
            double roundedMillion = Math.round((double) fullMonthly / 10000.0) / 100.0;

            String userBalInfo = goalContext.getUserDeclaredBalance() > 0 ?
                String.format("💵 **Số tiền hiện có (theo câu hỏi)**: %s VNĐ\n🔒 **Lựa chọn**: Giữ nguyên số tiền này và không sử dụng cho mục tiêu.\n", df.format(goalContext.getUserDeclaredBalance())) :
                "🔒 **Lựa chọn**: Giữ nguyên số dư hiện tại và không sử dụng cho mục tiêu này.\n";

            return String.format(
                "🎯 **Kế hoạch %s%s %s VNĐ trong %d tháng**\n\n" +
                "%s" +
                "📌 **Số tiền cần tích lũy mới**: %s VNĐ\n\n" +
                "➡️ **Mỗi tháng bạn cần tiết kiệm khoảng**:\n" +
                "**%s ÷ %d = %s VNĐ/tháng** trong %d tháng.\n\n" +
                "💡 **Gợi ý**: Bạn nên trích lập khoảng **%.2f triệu VNĐ/tháng** vào một ví riêng trên SmartSpend để bảo toàn kế hoạch %s%s đúng %d tháng.",
                actionPrefix, goalName,
                df.format(targetAmt), months,
                userBalInfo,
                df.format(targetAmt),
                df.format(targetAmt), months, df.format(fullMonthly), months,
                roundedMillion,
                actionPrefix, goalName, months
            );
        }

        // 2. If user specified a custom monthly saving rate (e.g. "Mỗi tháng tôi chỉ có thể tiết kiệm 2 triệu")
        if (goalContext.getCustomMonthlySaving() > 0) {
            long customAmt = goalContext.getCustomMonthlySaving();
            long effectiveBal = goalContext.getUserDeclaredBalance() > 0 ? goalContext.getUserDeclaredBalance() : dbTotalBal.longValue();
            long remainingGap = targetAmt > effectiveBal ? targetAmt - effectiveBal : 0;
            long neededMonthly = months > 0 ? Math.round((double) remainingGap / months) : customAmt;
            long gapMonthly = neededMonthly > customAmt ? neededMonthly - customAmt : 0;
            long monthsWithBal = (long) Math.ceil((double) remainingGap / customAmt);

            if (!goalContext.isAchievable()) {
                String balNotice = goalContext.getUserDeclaredBalance() > 0 ?
                    String.format("- Số tiền hiện có (giả định): **%s VNĐ** (Số dư thực tế trên SmartSpend: **%s VNĐ**).\n", df.format(goalContext.getUserDeclaredBalance()), df.format(dbTotalBal)) :
                    String.format("- Số dư hiện có trên SmartSpend: **%s VNĐ**.\n", df.format(dbTotalBal));

                return String.format(
                    "💻 **Đánh giá mục tiêu %s%s**\n\n" +
                    "Bạn muốn %s**%s %s VNĐ** trong %d tháng.\n\n" +
                    "📊 **Phân tích chi tiết:**\n" +
                    "%s" +
                    "- Số tiền còn thiếu: **%s VNĐ**.\n" +
                    "- Khả năng tiết kiệm: **%s VNĐ/tháng**.\n" +
                    "- Thời gian dự định: **%d tháng**.\n\n" +
                    "Sau %d tháng, tổng số tiền bạn có là:\n" +
                    "**%s + (%s × %d) = %s VNĐ**\n\n" +
                    "❌ **Kế hoạch chưa đủ để %s%s!**\n" +
                    "Bạn sẽ còn thiếu khoảng **%s VNĐ**.\n\n" +
                    "💡 **Gợi ý phương án điều chỉnh:**\n" +
                    "1. **Để đạt mục tiêu đúng %d tháng**: Bạn cần tiết kiệm khoảng **%s VNĐ/tháng** (tăng thêm khoảng **%s VNĐ/tháng**).\n" +
                    "2. **Nếu giữ nguyên mức tiết kiệm %s VNĐ/tháng**: Bạn cần khoảng **%d tháng** để đạt đủ mục tiêu.",
                    actionPrefix, goalName,
                    actionPrefix, goalName, df.format(targetAmt), months,
                    balNotice,
                    df.format(remainingGap),
                    df.format(customAmt),
                    months,
                    months,
                    df.format(effectiveBal), df.format(customAmt), months, df.format(goalContext.getProjectedAmount()),
                    actionPrefix, goalName,
                    df.format(goalContext.getShortfallAmount()),
                    months, df.format(neededMonthly), df.format(gapMonthly),
                    df.format(customAmt), monthsWithBal > 0 ? monthsWithBal : 1
                );
            } else {
                return String.format(
                    "💻 **Đánh giá mục tiêu %s%s**\n\n" +
                    "✅ **Kế hoạch hoàn toàn khả thi!**\n\n" +
                    "📊 **Phân tích chi tiết:**\n" +
                    "- Số tiền hiện có: **%s VNĐ**\n" +
                    "- Khả năng tiết kiệm: **%s VNĐ/tháng** × %d tháng = **%s VNĐ**\n" +
                    "- Tổng tiền dự kiến sau %d tháng: **%s VNĐ**\n\n" +
                    "🎯 Mục tiêu **%s VNĐ** sẽ đạt được đầy đủ!",
                    actionPrefix, goalName,
                    df.format(effectiveBal),
                    df.format(customAmt), months, df.format(customAmt * months),
                    months, df.format(goalContext.getProjectedAmount()),
                    df.format(targetAmt)
                );
            }
        }

        // 3. Standard 3-part layout (when customMonthlySaving == 0 and useCurrentBalance == true)
        long effectiveBal = goalContext.getUserDeclaredBalance() > 0 ? goalContext.getUserDeclaredBalance() : dbTotalBal.longValue();
        long remainingGap = targetAmt > effectiveBal ? targetAmt - effectiveBal : 0;
        long gapMonthly = months > 0 ? Math.round((double) remainingGap / months) : targetAmt;
        long fullMonthly = months > 0 ? Math.round((double) targetAmt / months) : targetAmt;

        String evaluationText;
        if (remainingGap == 0) {
            evaluationText = String.format(
                "Số dư hiện tại của bạn (%s VNĐ) đã đủ để hoàn thành mục tiêu %s%s %s VNĐ ngay hôm nay!",
                df.format(effectiveBal), actionPrefix, goalName, df.format(targetAmt)
            );
        } else {
            evaluationText = String.format(
                "Mục tiêu %s%s %s VNĐ trong %d tháng của bạn hoàn toàn khả thi nếu thiết lập kế hoạch tiết kiệm kỷ luật từ hôm nay.",
                actionPrefix, goalName, df.format(targetAmt), months
            );
        }

        return String.format(
            "🎯 **Đánh giá**\n" +
            "%s\n\n" +
            "📊 **Phân tích**\n" +
            "- Tổng số tiền cần có: %s VNĐ.\n" +
            "- Số dư hiện có: %s VNĐ.\n" +
            "- Số tiền còn thiếu: %s VNĐ.\n" +
            "- **Phương án 1 (Sử dụng toàn bộ số dư hiện tại %s VNĐ)**: Bạn cần tiết kiệm khoảng **%s VNĐ/tháng** trong %d tháng.\n" +
            "- **Phương án 2 (Giữ nguyên số dư hiện tại cho mục đích khác)**: Bạn cần tiết kiệm khoảng **%s VNĐ/tháng** trong %d tháng.\n\n" +
            "✅ **Gợi ý**\n" +
            "1. Ưu tiên trích lập khoản tiết kiệm cố định hàng tháng vào một ví riêng để bảo toàn nguồn vốn.\n" +
            "2. Thiết lập mục tiêu tài chính %s trên ứng dụng SmartSpend để dễ dàng theo dõi tiến độ.\n" +
            "3. Kiểm soát chặt chẽ chi tiêu hàng ngày để đảm bảo duy trì hạn mức tiết kiệm đúng kế hoạch.",
            evaluationText,
            df.format(targetAmt), df.format(effectiveBal), df.format(remainingGap),
            df.format(effectiveBal), df.format(gapMonthly), months,
            df.format(fullMonthly), months, goalName
        );
    }

    private boolean isFinancialGoalFollowUp(String norm) {
        if (norm == null || norm.isEmpty()) return false;

        return norm.contains("tiet kiem")
                || norm.contains("moi thang")
                || norm.contains("hang thang")
                || norm.contains("bao nhieu thang")
                || norm.contains("bao lau")
                || norm.contains("co du khong")
                || norm.contains("du khong")
                || norm.contains("thieu bao nhieu")
                || norm.contains("con thieu")
                || norm.contains("tang them")
                || norm.contains("tang thoi gian")
                || norm.contains("them thang")
                || norm.contains("giu lai")
                || norm.contains("giu nguyen")
                || norm.contains("khong dung")
                || norm.contains("su dung so du")
                || norm.contains("so tien hien co")
                || norm.contains("hien tai toi co")
                || norm.contains("toi co")
                || norm.contains("dang co")
                || norm.contains("quy du phong");
    }

    private boolean isBudgetPlanningQuery(String norm) {
        if (norm == null || norm.isEmpty()) return false;

        // How-to guide queries (e.g. "cách tạo ngân sách", "hướng dẫn tạo ngân sách") MUST be handled by APP_GUIDE!
        if (norm.contains("cach tao") || norm.contains("huong dan") || norm.contains("cach lap") || norm.contains("tao ngan sach")) {
            return false;
        }

        boolean hasIncome = norm.contains("luong") || norm.contains("thu nhap") || norm.contains("moi thang toi co") || norm.contains("moi thang toi nhan");
        boolean hasBudgetKeyword = norm.contains("chia ngan sach") || norm.contains("phan bo") || norm.contains("nen chia") 
                || norm.contains("nen tiet kiem bao nhieu") || norm.contains("tiet kiem bao nhieu") 
                || norm.contains("phan bo thu nhap") || norm.contains("chia the nao") || norm.contains("chia nhu the nao");

        return hasIncome || (hasBudgetKeyword && (norm.contains("chia") || norm.contains("phan bo") || norm.contains("luong") || norm.contains("thu nhap")));
    }

    private String buildBudgetRecommendationResponse(String userPrompt, Map<String, Object> ctx) {
        DecimalFormat df = new DecimalFormat("#,###");
        String normPrompt = normalizeText(userPrompt);

        Matcher incomeMatcher = Pattern.compile("(?:luong|thu nhap).*?(\\d+(?:[.,]\\d+)?)\\s*(trieu|tr|m)", Pattern.CASE_INSENSITIVE).matcher(normPrompt);
        Matcher rentMatcher = Pattern.compile("(?:tien thue|thue|tien nha).*?(\\d+(?:[.,]\\d+)?)\\s*(trieu|tr|m)", Pattern.CASE_INSENSITIVE).matcher(normPrompt);

        long income = 0;
        long rent = 0;

        if (incomeMatcher.find()) {
            double val = Double.parseDouble(incomeMatcher.group(1).replace(",", "."));
            income = (long) (val * 1_000_000L);
        }

        if (rentMatcher.find()) {
            double val = Double.parseDouble(rentMatcher.group(1).replace(",", "."));
            rent = (long) (val * 1_000_000L);
        }

        if (income <= 0) {
            return "💡 **Tư vấn lập ngân sách**\n\n" +
                   "Bạn vui lòng cho AI biết thu nhập hàng tháng (ví dụ: *'Lương tôi 12 triệu, tiền thuê 3 triệu. Nên chia thế nào?'*) để AI tính toán phân bổ ngân sách chính xác cho bạn nhé.";
        }

        long remaining = income - rent;

        if (remaining <= 0) {
            return String.format(
                "⚠️ **Cảnh báo ngân sách**\n\n" +
                "Chi phí thuê nhà **%s VNĐ** đã bằng hoặc vượt quá tổng thu nhập **%s VNĐ/tháng** của bạn.\n" +
                "Bạn nên xem xét tìm phương án giảm chi phí cố định này trước khi lập kế hoạch phân bổ chi tiêu.",
                df.format(rent), df.format(income)
            );
        }

        long food = Math.round(remaining * 0.40);
        long saving = Math.round(remaining * 0.25);
        long entertainment = Math.round(remaining * 0.15);
        long emergency = remaining - food - saving - entertainment;

        return String.format(
            "💰 **Gợi ý phân bổ ngân sách hàng tháng**\n\n" +
            "• Thu nhập hàng tháng: **%s VNĐ**\n" +
            "• Tiền thuê cố định: **%s VNĐ**\n" +
            "• Khoản khả dụng còn lại: **%s VNĐ**\n\n" +
            "📊 **Tỷ lệ phân bổ khuyến nghị:**\n" +
            "- 🏠 Tiền thuê & cố định: **%s VNĐ** (%.1f%%)\n" +
            "- 🍚 Ăn uống & sinh hoạt: **%s VNĐ** (%.1f%%)\n" +
            "- 💰 Tiết kiệm & đầu tư: **%s VNĐ** (%.1f%%)\n" +
            "- 🎮 Giải trí & cá nhân: **%s VNĐ** (%.1f%%)\n" +
            "- 🛡️ Quỹ dự phòng linh hoạt: **%s VNĐ** (%.1f%%)",
            df.format(income),
            df.format(rent),
            df.format(remaining),
            df.format(rent), (double) rent / income * 100,
            df.format(food), (double) food / income * 100,
            df.format(saving), (double) saving / income * 100,
            df.format(entertainment), (double) entertainment / income * 100,
            df.format(emergency), (double) emergency / income * 100
        );
    }

    private String buildAppGuideResponse(String norm) {
        if (norm == null) norm = "";

        if (norm.contains("vi") || norm.contains("tao vi") || norm.contains("them vi")) {
            return "👛 **Hướng dẫn Tạo & Quản lý Ví trên SmartSpend**\n\n" +
                   "Để tạo ví mới và quản lý dòng tiền cá nhân:\n" +
                   "1. Mở mục **Ví tiền** (Wallet) từ Menu chính.\n" +
                   "2. Nhấn nút **Thêm ví mới** (+).\n" +
                   "3. Nhập **Tên ví** (ví dụ: *'Ví Tiền mặt'*, *'Ví MoMo'*, *'Tài khoản VCB'*).\n" +
                   "4. Chọn Loại tài khoản & Nhập **Số dư ban đầu**.\n" +
                   "5. Nhấn **Tạo ví**. Số dư ví mới sẽ tự động được cộng vào Tổng tài sản của bạn!";
        }

        if (norm.contains("danh muc") || norm.contains("tao danh muc") || norm.contains("them danh muc")) {
            return "🏷️ **Hướng dẫn Tạo & Quản lý Danh mục Chi tiêu**\n\n" +
                   "Các bước tạo danh mục thu chi mới:\n" +
                   "1. Vào mục **Cài đặt** ➔ Chọn **Quản lý danh mục**.\n" +
                   "2. Chọn Tab **Chi tiêu** hoặc **Thu nhập**.\n" +
                   "3. Nhấn **Thêm danh mục mới** (+).\n" +
                   "4. Nhập **Tên danh mục** (ví dụ: *'Ăn uống'*, *'Giải trí'*, *'Học tập'*).\n" +
                   "5. Chọn Biểu tượng (Icon) & Màu sắc đại diện ➔ Nhấn **Lưu**.\n" +
                   "Danh mục mới sẽ xuất hiện ngay lập tức khi bạn Thêm giao dịch!";
        }

        if (norm.contains("ngan sach") || norm.contains("tao ngan sach") || norm.contains("lap ngan sach")) {
            return "🎯 **Hướng dẫn Thiết lập Hạn mức Ngân sách**\n\n" +
                   "Các bước tạo ngân sách kiểm soát chi tiêu:\n" +
                   "1. Mở màn hình **Ngân sách** (Budget) trên thanh điều hướng.\n" +
                   "2. Nhấn **Tạo ngân sách mới** (+).\n" +
                   "3. Chọn **Danh mục chi tiêu** cần kiểm soát (ví dụ: *'Ăn uống'*, *'Mua sắm'*).\n" +
                   "4. Nhập **Hạn mức số tiền tối đa** cho tháng.\n" +
                   "5. Nhấn **Xác nhận**. AI SmartSpend sẽ tự động gửi cảnh báo khi chi tiêu của bạn đạt 80% và 100% hạn mức!";
        }

        if (norm.contains("giao dich") || norm.contains("them giao dich") || norm.contains("ghi chep") || norm.contains("nhap thu chi")) {
            return "📝 **Hướng dẫn Tạo Giao dịch Thu / Chi**\n\n" +
                   "Các bước ghi chép giao dịch nhanh:\n" +
                   "1. Nhấn nút **Cộng (+)** màu xanh nổi ở giữa thanh Menu bên dưới.\n" +
                   "2. Chọn loại giao dịch: **Chi tiêu** hoặc **Thu nhập**.\n" +
                   "3. Nhập **Số tiền** giao dịch.\n" +
                   "4. Chọn **Danh mục** & **Ví thanh toán** tương ứng.\n" +
                   "5. Nhấn **Lưu giao dịch**. Hệ thống sẽ tự động cập nhật số dư ví và biểu đồ báo cáo!";
        }

        if (norm.contains("nap") || norm.contains("rut") || norm.contains("chuyen tien")) {
            return "💰 **Hướng dẫn Nạp, Rút & Chuyển tiền giữa các Ví**\n\n" +
                   "• **Để Nạp tiền vào Ví**:\n" +
                   "  1. Vào màn hình **Ví tiền** ➔ Chọn Ví cần nạp ➔ Nhấn **Nạp tiền**.\n" +
                   "  2. Nhập số tiền & Xác nhận giao dịch.\n\n" +
                   "• **Để Rút tiền / Chuyển tiền giữa các Ví**:\n" +
                   "  1. Vào màn hình **Ví tiền** ➔ Chọn **Chuyển tiền**.\n" +
                   "  2. Chọn **Ví nguồn**, **Ví nhận** & Nhập **Số tiền chuyển**.\n" +
                   "  3. Nhấn **Xác nhận chuyển**. Số dư các ví sẽ được cập nhật tự động!";
        }

        if (norm.contains("pin") || norm.contains("mat khau")) {
            return "🔒 **Hướng dẫn Đổi & Khôi phục Mã PIN Bảo mật**\n\n" +
                   "• **Đổi mã PIN**: Vào **Cài đặt** ➔ **Bảo mật** ➔ **Đổi mã PIN** ➔ Nhập PIN hiện tại và PIN mới.\n" +
                   "• **Quên mã PIN**: Tại màn hình nhập PIN, nhấn **'Quên mã PIN'** ➔ Hệ thống sẽ gửi mã OTP xác minh qua Email đăng ký để bạn tạo lại PIN mới an toàn!";
        }

        return "📖 **Hướng dẫn Sử dụng ứng dụng SmartSpend**\n\n" +
               "SmartSpend hỗ trợ bạn quản lý tài chính toàn diện:\n" +
               "1. 👛 **Quản lý Ví tiền**: Thêm ví tiền mặt, ví điện tử, tài khoản ngân hàng.\n" +
               "2. 🏷️ **Danh mục**: Phân loại các khoản Thu / Chi dễ dàng.\n" +
               "3. 🎯 **Ngân sách**: Đặt hạn mức chi tiêu hàng tháng và nhận cảnh báo tự động.\n" +
               "4. 📝 **Ghi chép giao dịch**: Nhấn nút (+) ở Menu dưới để ghi chép nhanh giao dịch.";
    }

    private AiChatResponse fallbackLocalEngine(Map<String, Object> ctx, String raw, String norm, String moduleType, 
                                               List<ChatMessageHistoryDto> history, GoalContext goalContext, boolean isFollowUp) {
        DecimalFormat df = new DecimalFormat("#,###");
        String username = (String) ctx.get("username");
        BigDecimal totalBal = (BigDecimal) ctx.get("totalBalance");

        String text;
        if ("APP_GUIDE".equalsIgnoreCase(moduleType) || aiIntentService.isAppGuideQueryPrompt(norm)) {
            text = buildAppGuideResponse(norm);
        } else if ("ANALYTICS".equalsIgnoreCase(moduleType) || norm.contains("tieu o dau") || norm.contains("cat giam")) {
            String topCat = (String) ctx.get("topCategoryName");
            BigDecimal topAmt = (BigDecimal) ctx.get("topCategoryAmount");
            Double topPct = (Double) ctx.get("topCategoryPercentage");
            String secondCat = (String) ctx.get("secondCategoryName");
            BigDecimal secondAmt = (BigDecimal) ctx.get("secondCategoryAmount");
            Double secondPct = (Double) ctx.get("secondCategoryPercentage");

            boolean hasExpense = ctx.get("hasExpenseData") != null && (boolean) ctx.get("hasExpenseData");

            if (hasExpense && topCat != null) {
                String secondText = secondCat != null ? String.format(", đồng thời rà soát thêm danh mục '%s' (%s VNĐ, chiếm %.1f%%)", secondCat, df.format(secondAmt), secondPct) : "";
                text = String.format(
                    "Dựa trên thói quen chi tiêu thực tế của %s trong tháng này:\n\n" +
                    "1. Phân tích danh mục lớn nhất: Bạn đang chi nhiều tiền nhất cho '%s' với %s VNĐ (chiếm %.1f%% tổng chi tiêu tháng).\n" +
                    "2. Gợi ý cắt giảm cụ thể: Hãy ưu tiên cắt giảm 15 - 20%% chi phí ở danh mục '%s' để tiết kiệm khoảng %s VNĐ/tháng%s.\n" +
                    "3. Khuyến nghị hành động: Mở mục Ngân sách để thiết lập hạn mức kiểm soát cho '%s', AI sẽ gửi cảnh báo tự động khi bạn chi tiêu gần vượt ngưỡng.",
                    username, topCat, df.format(topAmt), topPct, topCat, df.format(topAmt.multiply(new BigDecimal("0.2"))), secondText, topCat
                );
            } else {
                text = "Phân tích & Gợi ý cắt giảm chi tiêu cho " + username + ":\n\n" +
                       "1. Tài khoản của bạn hiện chưa ghi nhận phát sinh giao dịch chi tiêu trong tháng này.\n" +
                       "2. Để AI phân tích chính xác thói quen tiêu dùng cá nhân và chỉ ra khoản lãng phí cần cắt giảm, hãy Nạp tiền vào ví hoặc Ghi chép các giao dịch thu chi hàng ngày.\n" +
                       "3. Theo quy tắc quản lý tài chính 50/30/20, các khoản chi dễ cắt giảm nhất gồm: Mua sắm ngẫu hứng, Ăn uống ngoài không kế hoạch, Trà sữa/Cà phê hàng ngày và các Dịch vụ đăng ký không sử dụng.";
            }
        } else if (goalContext != null && goalContext.isGoalQuery()) {
            if (isFollowUp) {
                boolean mentionKeepBal = norm.contains("khong dung") || norm.contains("giu nguyen") || norm.contains("so sanh");
                if (mentionKeepBal) {
                    text = String.format(
                        "Nếu giữ nguyên số dư %s VNĐ hiện có cho mục đích khác, bạn cần tiết kiệm khoảng %s VNĐ/tháng trong %d tháng.",
                        df.format(totalBal), df.format(goalContext.getMonthlySaving()), goalContext.getDurationMonths()
                    );
                } else {
                    text = String.format(
                        "Nếu sử dụng số dư hiện tại %s VNĐ, bạn cần tiết kiệm khoảng %s VNĐ/tháng trong %d tháng để mua %s.",
                        df.format(totalBal), df.format(goalContext.getMonthlyGapSaving() > 0 ? goalContext.getMonthlyGapSaving() : goalContext.getMonthlySaving()),
                        goalContext.getDurationMonths(), goalContext.getGoalName()
                    );
                }
            } else {
                String actionPrefix = goalContext.getGoalName().startsWith("tích lũy") ? "" : "mua ";
                String evaluationText;
                if (goalContext.getRemainingAmount() == 0) {
                    evaluationText = String.format(
                        "Số dư hiện tại của bạn (%s VNĐ) đã đủ để hoàn thành mục tiêu %s%s %s VNĐ ngay hôm nay!",
                        df.format(totalBal), actionPrefix, goalContext.getGoalName(), df.format(goalContext.getTargetAmount())
                    );
                } else {
                    evaluationText = String.format(
                        "Mục tiêu %s%s %s VNĐ trong %d tháng của bạn hoàn toàn khả thi nếu thiết lập kế hoạch tiết kiệm kỷ luật từ hôm nay.",
                        actionPrefix, goalContext.getGoalName(), df.format(goalContext.getTargetAmount()), goalContext.getDurationMonths()
                    );
                }

                text = String.format(
                    "🎯 Đánh giá\n" +
                    "%s\n\n" +
                    "📊 Phân tích\n" +
                    "- Tổng số tiền cần có: %s VNĐ.\n" +
                    "- Số dư hiện có: %s VNĐ.\n" +
                    "- Số tiền còn thiếu: %s VNĐ.\n" +
                    "- Phương án 1 (Sử dụng toàn bộ số dư hiện tại %s VNĐ): Bạn cần tiết kiệm khoảng %s VNĐ/tháng trong %d tháng.\n" +
                    "- Phương án 2 (Giữ nguyên số dư hiện tại cho mục đích khác): Bạn cần tiết kiệm khoảng %s VNĐ/tháng trong %d tháng.\n\n" +
                    "✅ Gợi ý\n" +
                    "1. Ưu tiên trích lập khoản tiết kiệm cố định hàng tháng vào một ví riêng để bảo toàn nguồn vốn.\n" +
                    "2. Thiết lập mục tiêu tài chính %s trên ứng dụng SmartSpend để dễ dàng theo dõi tiến độ.\n" +
                    "3. Kiểm soát chặt chẽ chi tiêu hàng ngày để đảm bảo duy trì hạn mức tiết kiệm đúng kế hoạch.",
                    evaluationText,
                    df.format(goalContext.getTargetAmount()), df.format(totalBal), df.format(goalContext.getRemainingAmount()),
                    df.format(totalBal), df.format(goalContext.getMonthlyGapSaving()), goalContext.getDurationMonths(),
                    df.format(goalContext.getMonthlySaving()), goalContext.getDurationMonths(), goalContext.getGoalName()
                );
            }
        } else if ("RECOMMENDATION".equalsIgnoreCase(moduleType) || isBudgetPlanningQuery(norm)) {
            text = buildBudgetRecommendationResponse(raw, ctx);
        } else {
            text = "Xin chào " + username + "! Tôi là Trợ lý AI SmartSpend.\n\n" +
                   "Tôi có thể hỗ trợ bạn:\n" +
                   "1. 💡 Tư vấn lập kế hoạch tiết kiệm mua sắm (ví dụ: 'Tôi muốn mua laptop 25 triệu trong 8 tháng').\n" +
                   "2. 📊 Phân tích danh mục chi tiêu & Gợi ý khoản cần cắt giảm.\n" +
                   "3. 💰 Hướng dẫn quản lý hạn mức ngân sách và phân bổ thu nhập hợp lý.";
        }

        List<AiCardDto> cards = generateCards(moduleType, norm, raw, ctx);
        AiActionPromptDto actionPrompt = generateActionPrompt(moduleType, norm, raw);

        return AiChatResponse.builder()
                .id(UUID.randomUUID().toString())
                .text(text)
                .moduleType(moduleType)
                .timestamp(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")))
                .cards(cards)
                .actionPrompt(actionPrompt)
                .build();
    }

    private List<AiCardDto> generateCards(String moduleType, String norm, String rawPrompt, Map<String, Object> ctx) {
        DecimalFormat df = new DecimalFormat("#,###");
        List<AiCardDto> cards = new ArrayList<>();

        if (norm.contains("luong") || norm.contains("thue") || norm.contains("chia") || norm.contains("phan bo")) {
            Matcher incomeMatcher = Pattern.compile("(?:lương|thu nhập)\\s*(?:tôi)?\\s*(\\d+)", Pattern.CASE_INSENSITIVE).matcher(rawPrompt);
            Matcher fallbackIncome = Pattern.compile("(\\d+)\\s*(triệu|tr)", Pattern.CASE_INSENSITIVE).matcher(rawPrompt);
            Matcher rentMatcher = Pattern.compile("thuê\\s*(\\d+)", Pattern.CASE_INSENSITIVE).matcher(rawPrompt);

            long income = incomeMatcher.find() ? Long.parseLong(incomeMatcher.group(1)) * 1000000L :
                    (fallbackIncome.find() ? Long.parseLong(fallbackIncome.group(1)) * 1000000L : 12000000L);
            long rent = rentMatcher.find() ? Long.parseLong(rentMatcher.group(1)) * 1000000L : 3000000L;

            long food = Math.round(income * 0.29);
            long saving = Math.round(income * 0.21);
            long entertainment = Math.round(income * 0.25);

            cards.add(AiCardDto.builder()
                    .type("BUDGET_SPLIT")
                    .title("Tỷ lệ phân bổ ngân sách khuyến nghị")
                    .items(Arrays.asList(
                            AiCardItemDto.builder().label("Tiền thuê & Cố định (25%)").value(df.format(rent) + " đ").color("#EF4444").build(),
                            AiCardItemDto.builder().label("Ăn uống & Sinh hoạt (29%)").value(df.format(food) + " đ").color("#F59E0B").build(),
                            AiCardItemDto.builder().label("Tiết kiệm & Đầu tư (21%)").value(df.format(saving) + " đ").color("#10B981").build(),
                            AiCardItemDto.builder().label("Giải trí & Khác (25%)").value(df.format(entertainment) + " đ").color("#6366F1").build()
                    ))
                    .build());
            return cards;
        }

        return cards;
    }

    private AiActionPromptDto generateActionPrompt(String moduleType, String norm, String rawPrompt) {
        if ("FINANCIAL_GOAL".equalsIgnoreCase(moduleType) || norm.contains("muc tieu") || norm.contains("mua") || norm.contains("tiet kiem")) {
            String itemName = goalNameParser.extractGoalName(rawPrompt, norm);
            String labelText = "🎯 Thiết lập mục tiêu " + (itemName.startsWith("tích lũy") ? itemName : "mua " + itemName);
            AiActionItemDto action = AiActionItemDto.builder()
                    .label(labelText)
                    .route("/goals/create")
                    .prompt("Tạo mục tiêu " + itemName)
                    .build();
            return AiActionPromptDto.builder()
                    .question("Gợi ý hành động nhanh cho mục tiêu tài chính của bạn:")
                    .actions(Collections.singletonList(action))
                    .build();
        } else if ("ANALYTICS".equalsIgnoreCase(moduleType) || norm.contains("chi tieu") || norm.contains("cat giam")) {
            AiActionItemDto action = AiActionItemDto.builder()
                    .label("📊 Xem báo cáo chi tiết thu chi")
                    .route("/reports")
                    .prompt("Xem báo cáo chi tiêu")
                    .build();
            return AiActionPromptDto.builder()
                    .question("Gợi ý xem báo cáo phân tích chi tiêu:")
                    .actions(Collections.singletonList(action))
                    .build();
        } else if ("RECOMMENDATION".equalsIgnoreCase(moduleType) || norm.contains("ngan sach") || norm.contains("phan bo")) {
            AiActionItemDto action = AiActionItemDto.builder()
                    .label("💰 Thiết lập hạn mức ngân sách")
                    .route("/budgets/create")
                    .prompt("Thiết lập ngân sách")
                    .build();
            return AiActionPromptDto.builder()
                    .question("Gợi ý quản lý hạn mức ngân sách:")
                    .actions(Collections.singletonList(action))
                    .build();
        }
        return null;
    }

    private String sanitizeAiText(String text, boolean isFollowUp) {
        if (text == null) return "";
        String result = text.trim();

        if (isFollowUp) {
            result = result.replaceAll("(?m)^🎯\\s*Đánh giá.*$", "").trim();
            result = result.replaceAll("(?m)^📊\\s*Phân tích.*$", "").trim();
            result = result.replaceAll("(?m)^✅\\s*Gợi ý.*$", "").trim();
        } else {
            int lastTargetIdx = result.lastIndexOf("🎯");
            if (lastTargetIdx != -1) {
                result = result.substring(lastTargetIdx).trim();
            } else {
                int lastNumIdx = result.lastIndexOf("1. ");
                if (lastNumIdx != -1 && (result.contains("User Goal") || result.contains("User Identity") || result.contains("Drafting") || result.contains("Step 1") || result.contains("Rule 1") || result.contains("Self-"))) {
                    result = result.substring(lastNumIdx).trim();
                } else if (result.contains("User Goal") || result.contains("User Identity") || result.contains("Drafting") || result.contains("Step 1") || result.contains("Rule 1") || result.contains("Self-")) {
                    Pattern p = Pattern.compile("(?m)^(1\\.|[1-9]\\.|Để|Lộ trình|Hướng dẫn|Tài khoản|Dựa trên|Gợi ý)");
                    Matcher m = p.matcher(result);
                    if (m.find()) {
                        result = result.substring(m.start()).trim();
                    }
                }
            }
        }

        String[] trailingMarkers = {"*Self-", "Self-Correction", "Check structure", "Check language", "Check constraints", "Check math", "Ensure tone", "Vietnamese only"};
        for (String marker : trailingMarkers) {
            int idx = result.indexOf(marker);
            if (idx != -1) {
                result = result.substring(0, idx).trim();
            }
        }

        return result;
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
