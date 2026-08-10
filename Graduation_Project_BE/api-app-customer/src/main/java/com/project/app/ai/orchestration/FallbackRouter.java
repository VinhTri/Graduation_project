package com.project.app.ai.orchestration;

import com.project.app.ai.dto.internal.DurationInfo;
import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import com.project.app.ai.parser.AmountParser;
import com.project.app.ai.service.DateResolverService;
import com.project.app.ai.tool.AiTool;
import com.project.app.ai.tool.dto.ToolCallDto;
import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.ai.util.TextNormalizer;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.text.DecimalFormat;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class FallbackRouter {

    private final List<AiTool> availableTools;
    private final AmountParser amountParser;
    private final DateResolverService dateResolverService;

    /**
     * Emergency / Remote LLM failure Fallback Router.
     * Slim, robust router handling only core domains: APP_GUIDE, WALLET, SPENDING, GOAL.
     */
    public AiOrchestrator.OrchestratorResult handleFallback(
            User user,
            String userPrompt,
            List<ChatMessageHistoryDto> history,
            Exception exception
    ) {
        String norm = TextNormalizer.normalize(userPrompt);

        // 1. APP GUIDE Fallback
        if (isAppGuidePrompt(norm)) {
            AiTool guideTool = findTool("get_app_guide");
            if (guideTool != null) {
                Map<String, Object> toolArgs = Map.of("topic", userPrompt);
                ToolResultDto toolResult = guideTool.execute(user, toolArgs);

                String guideText = "";
                if (toolResult != null && toolResult.getData() != null) {
                    guideText = String.valueOf(toolResult.getData().getOrDefault("guideContent", ""));
                }

                return AiOrchestrator.OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(guideText))
                        .executedToolCall(ToolCallDto.builder().name("get_app_guide").arguments(toolArgs).build())
                        .toolResult(toolResult)
                        .build();
            }
        }

        // 2. WALLET & BALANCE Fallback (Fixed bug: Uses highestWallet / lowestWallet explicitly)
        if (isWalletQuery(norm)) {
            AiTool walletTool = findTool("get_wallets_and_balance");
            if (walletTool != null) {
                ToolResultDto toolResult = walletTool.execute(user, Collections.emptyMap());
                DecimalFormat df = new DecimalFormat("#,###");
                Map<String, Object> data = toolResult.getData();

                boolean isLowestQuery = norm.contains("it tien nhat") || norm.contains("thap nhat");

                String text;
                if (!isLowestQuery && (norm.contains("tong tien") || norm.contains("tat ca vi") || norm.contains("so du"))) {
                    long totalBal = ((Number) data.getOrDefault("totalBalance", 0L)).longValue();
                    text = String.format("Tổng số dư hiện tại trong tất cả các ví của bạn là **%s VNĐ**.", df.format(totalBal));
                } else {
                    Object targetWObj = isLowestQuery ? data.get("lowestWallet") : data.get("highestWallet");
                    String walletName = "Ví";
                    long balance = 0;

                    if (targetWObj instanceof Map<?, ?> wMap) {
                        Object nameObj = wMap.get("name");
                        walletName = nameObj != null ? nameObj.toString() : "Ví";
                        Object balObj = wMap.get("balance");
                        balance = balObj instanceof Number ? ((Number) balObj).longValue() : 0L;
                    }

                    if (isLowestQuery) {
                        text = String.format("Ví có số dư thấp nhất của bạn hiện tại là **%s** với số dư **%s VNĐ**.", walletName, df.format(balance));
                    } else {
                        text = String.format("Ví có nhiều tiền nhất của bạn hiện tại là **%s** với số dư **%s VNĐ**.", walletName, df.format(balance));
                    }
                }

                return AiOrchestrator.OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(text))
                        .executedToolCall(ToolCallDto.builder().name("get_wallets_and_balance").arguments(Collections.emptyMap()).build())
                        .toolResult(toolResult)
                        .build();
            }
        }

        // 3. SPENDING Fallback
        if (isSpendingQuery(norm)) {
            String period = norm.contains("hom nay") ? "TODAY" : (norm.contains("hom qua") ? "YESTERDAY" : "MONTH");
            Map<String, Object> toolArgs = Map.of("period", period);
            AiTool txTool = findTool("get_monthly_spending");

            if (txTool != null) {
                ToolResultDto toolResult = txTool.execute(user, toolArgs);
                DecimalFormat df = new DecimalFormat("#,###");
                Map<String, Object> data = toolResult.getData();
                long totalSpent = ((Number) data.getOrDefault("totalSpent", 0L)).longValue();

                String text = String.format("Trong khoảng thời gian này, bạn đã chi tiêu tổng cộng **%s VNĐ**.", df.format(totalSpent));

                return AiOrchestrator.OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(text))
                        .executedToolCall(ToolCallDto.builder().name("get_monthly_spending").arguments(toolArgs).build())
                        .toolResult(toolResult)
                        .build();
            }
        }

        // 4. GOAL PLAN Fallback
        boolean isFollowUp = isFollowUpSlotFill(history);
        if (isGoalPrompt(norm, isFollowUp)) {
            long customMonthlySaving = amountParser.isMonthlySavingStatement(userPrompt) ? amountParser.parse(userPrompt) : 0;
            long targetAmount = amountParser.parseGoalAmount(userPrompt, history, !isFollowUp, "mục tiêu", customMonthlySaving);
            DurationInfo durationInfo = dateResolverService.resolveDuration(userPrompt, LocalDate.now());
            int months = durationInfo != null && durationInfo.getMonths() != null ? durationInfo.getMonths() : 0;

            String goalName = norm.contains("laptop") ? "laptop" : (norm.contains("xe") || norm.contains("oto") ? "xe" : "mục tiêu tài chính");

            if (targetAmount == 0 && months <= 0) {
                return AiOrchestrator.OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(String.format("Bạn dự định mua %s khoảng bao nhiêu tiền và trong thời gian bao lâu?", goalName)))
                        .build();
            }

            Map<String, Object> toolArgs = new HashMap<>();
            toolArgs.put("goalName", goalName);
            toolArgs.put("targetAmount", targetAmount);
            toolArgs.put("durationMonths", months);

            AiTool goalTool = findTool("calculate_saving_plan");
            if (goalTool != null) {
                ToolResultDto toolResult = goalTool.execute(user, toolArgs);
                DecimalFormat df = new DecimalFormat("#,###");

                String durText = durationInfo != null && durationInfo.getOriginalText() != null
                        ? durationInfo.getOriginalText()
                        : (months > 0 ? months + " tháng" : "thời hạn đã chọn");

                return AiOrchestrator.OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(String.format(
                                "Để đạt mục tiêu %s trị giá %s VNĐ (%s), bạn có thể tham khảo kế hoạch tiết kiệm từ hệ thống SmartSpend.",
                                goalName, df.format(targetAmount), durText)))
                        .executedToolCall(ToolCallDto.builder().name("calculate_saving_plan").arguments(toolArgs).build())
                        .toolResult(toolResult)
                        .build();
            }
        }

        // Default Generic Fallback Response
        return AiOrchestrator.OrchestratorResult.builder()
                .responseText("SmartSpend AI Assistant đã ghi nhận câu hỏi của bạn. Hệ thống hỗ trợ phân tích chi tiêu, quản lý ví và lên kế hoạch tiết kiệm tích lũy mục tiêu tài chính.")
                .build();
    }

    private AiTool findTool(String toolName) {
        if (availableTools == null) return null;
        return availableTools.stream()
                .filter(t -> toolName.equals(t.getName()))
                .findFirst()
                .orElse(null);
    }

    private boolean isAppGuidePrompt(String norm) {
        return norm.contains("huong dan") || norm.contains("lam sao tao") || norm.contains("cach tao")
                || norm.contains("nap tien") || norm.contains("rut tien") || norm.contains("quen pin");
    }

    private boolean isWalletQuery(String norm) {
        return norm.contains("so du") || norm.contains("vi nao") || norm.contains("tat ca vi") || norm.equals("vi");
    }

    private boolean isSpendingQuery(String norm) {
        return norm.contains("tieu") || norm.contains("chi") || norm.contains("bao cao");
    }

    private boolean isGoalPrompt(String norm, boolean isFollowUp) {
        if (isFollowUp) return true;

        return norm.contains("muc tieu")
                || norm.contains("tiet kiem")
                || norm.contains("tich luy")
                || norm.contains("dat duoc")
                || norm.contains("can co")
                || norm.contains("muon co")
                || norm.contains("mua")
                || norm.contains("mua oto")
                || norm.contains("mua o to")
                || norm.contains("mua xe")
                || norm.contains("mua nha")
                || norm.contains("mua laptop")
                || norm.contains("mua iphone")
                || norm.contains("du phong")
                || norm.contains("giu lai");
    }

    private boolean isFollowUpSlotFill(List<ChatMessageHistoryDto> history) {
        if (history == null || history.isEmpty()) return false;
        for (int i = history.size() - 1; i >= 0; i--) {
            ChatMessageHistoryDto msg = history.get(i);
            if (msg != null && "model".equalsIgnoreCase(msg.getRole()) && msg.getContent() != null) {
                String c = TextNormalizer.removeAccents(msg.getContent());
                return c.contains("bao nhieu tien") || c.contains("trong thoi gian bao lau");
            }
        }
        return false;
    }
}
