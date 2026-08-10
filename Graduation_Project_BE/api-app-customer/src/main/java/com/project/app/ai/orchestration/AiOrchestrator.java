package com.project.app.ai.orchestration;

import com.project.app.ai.calculator.GoalCalculator;
import com.project.app.ai.client.dto.GeminiResponseDto;
import com.project.app.ai.dto.internal.ConversationState;
import com.project.app.ai.dto.internal.DurationInfo;
import com.project.app.ai.dto.internal.SavingPlan;
import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import com.project.app.ai.memory.ConversationMemoryService;
import com.project.app.ai.parser.AmountParser;
import com.project.app.ai.prompt.PromptTemplateService;
import com.project.app.ai.service.DateResolverService;
import com.project.app.ai.tool.AiTool;
import com.project.app.ai.tool.dto.ToolCallDto;
import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.ai.util.TextNormalizer;
import com.project.app.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.DecimalFormat;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiOrchestrator {

    private final ChatClient chatClient;
    private final ConversationMemoryService conversationMemoryService;
    private final PromptTemplateService promptTemplateService;
    private final List<AiTool> availableTools;
    private final FallbackRouter fallbackRouter;
    private final IntentRouter intentRouter;
    private final AmountParser amountParser;
    private final DateResolverService dateResolverService;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrchestratorResult {
        private String responseText;
        private ToolCallDto executedToolCall;
        private ToolResultDto toolResult;
    }

    public OrchestratorResult processRequest(
            User user,
            String conversationId,
            String userPrompt
    ) {
        userPrompt = TextNormalizer.normalizeWhitespace(userPrompt);

        // 1. Memory Integration (Fetch History with User Isolation)
        List<ChatMessageHistoryDto> history = conversationMemoryService.getHistory(user, conversationId);

        // 2. Fetch ConversationState (State & Parameter Inheritance)
        ConversationState state = conversationMemoryService.getState(user, conversationId);

        // Save User Message to Memory
        conversationMemoryService.addMessage(user, conversationId, "user", userPrompt);

        // 3. Pre-LLM Intent Classification (IntentRouter with State Context)
        IntentRouter.AiIntent intent = intentRouter.detectIntent(userPrompt, state);

        List<String> toolNames = availableTools != null ? availableTools.stream().map(AiTool::getName).toList() : Collections.emptyList();
        AiTool foundGoalTool = findTool("calculate_saving_plan");

        log.error("========== AI DEBUG ==========");
        log.error("PROMPT = {}", userPrompt);
        log.error("STATE BEFORE MERGE = {}", state);
        log.error("INTENT = {}", intent);
        log.error("GOAL TOOL = {}", foundGoalTool);
        log.error("ALL TOOLS = {}", toolNames);
        log.error("==============================");

        // Deterministic handling for QUERY_WALLET query
        if (intent == IntentRouter.AiIntent.QUERY_WALLET) {
            state.setLastIntent(intent);
            conversationMemoryService.saveState(user, conversationId, state);

            AiTool walletTool = findTool("get_wallets_and_balance");
            if (walletTool != null) {
                ToolResultDto toolResult = walletTool.execute(user, Collections.emptyMap());
                Map<String, Object> data = toolResult.getData();
                long totalBal = data != null && data.get("totalBalance") != null ? parseLong(data.get("totalBalance")) : 0L;
                int walletCount = data != null && data.get("walletCount") != null ? ((Number) data.get("walletCount")).intValue() : 0;
                DecimalFormat df = new DecimalFormat("#,###");

                String responseText;
                if (walletCount > 0) {
                    responseText = String.format("Bạn đang có **%d ví** trên SmartSpend với tổng số dư hiện tại là **%s VNĐ**.", walletCount, df.format(totalBal));
                } else {
                    responseText = "Bạn chưa tạo ví nào trên SmartSpend. Bạn có thể tạo ví mới trong mục Quản lý ví để bắt đầu theo dõi số dư.";
                }

                OrchestratorResult res = OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(responseText))
                        .executedToolCall(ToolCallDto.builder().name("get_wallets_and_balance").arguments(Collections.emptyMap()).build())
                        .toolResult(toolResult)
                        .build();

                conversationMemoryService.addMessage(user, conversationId, "model", res.getResponseText());
                return res;
            }
        }

        // Deterministic handling for QUERY_SPENDING query
        if (intent == IntentRouter.AiIntent.QUERY_SPENDING) {
            state.setLastIntent(intent);
            conversationMemoryService.saveState(user, conversationId, state);

            AiTool txTool = findTool("get_monthly_spending");
            if (txTool != null) {
                Map<String, Object> toolArgs = Map.of("period", "MONTH");
                ToolResultDto toolResult = txTool.execute(user, toolArgs);
                Map<String, Object> data = toolResult.getData();
                long totalSpent = data != null && data.get("totalSpent") != null ? parseLong(data.get("totalSpent")) : 0L;
                Object topCategory = data != null ? data.get("topCategory") : null;
                Object topCategoryAmount = data != null ? data.get("topCategoryAmount") : null;
                DecimalFormat df = new DecimalFormat("#,###");

                String responseText;
                if (totalSpent > 0) {
                    if (topCategory != null && topCategoryAmount != null) {
                        responseText = String.format("Tổng chi tiêu tháng này của bạn là **%s VNĐ**. Trong đó danh mục chiếm chi phí lớn nhất là **%s** (**%s VNĐ**).",
                                df.format(totalSpent), topCategory, df.format(parseLong(topCategoryAmount)));
                    } else {
                        responseText = String.format("Tổng chi tiêu tháng này của bạn là **%s VNĐ**.", df.format(totalSpent));
                    }
                } else {
                    responseText = "Hiện tại chưa có dữ liệu chi tiêu nào được ghi nhận trong tháng này.";
                }

                OrchestratorResult res = OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(responseText))
                        .executedToolCall(ToolCallDto.builder().name("get_monthly_spending").arguments(toolArgs).build())
                        .toolResult(toolResult)
                        .build();

                conversationMemoryService.addMessage(user, conversationId, "model", res.getResponseText());
                return res;
            }
        }

        // Deterministic handling for BUDGET query
        if (intent == IntentRouter.AiIntent.QUERY_BUDGET) {
            state.setLastIntent(intent);
            conversationMemoryService.saveState(user, conversationId, state);

            long income = amountParser.parseUserDeclaredBalance(userPrompt);
            long fixedExpenses = amountParser.parseFixedExpense(userPrompt);

            AiTool budgetTool = findTool("recommend_budget_allocation");
            if (budgetTool != null) {
                Map<String, Object> toolArgs = new HashMap<>();
                toolArgs.put("action", "RECOMMEND");
                if (income > 0) toolArgs.put("income", income);
                if (fixedExpenses > 0) toolArgs.put("fixedExpenses", fixedExpenses);

                ToolResultDto toolResult = budgetTool.execute(user, toolArgs);
                String responseText;
                if (!toolResult.isSuccess() && toolResult.getData() != null && toolResult.getData().containsKey("promptUser")) {
                    responseText = (String) toolResult.getData().get("promptUser");
                } else {
                    responseText = (String) toolResult.getData().getOrDefault("adviceText", toolResult.getMessage());
                }

                OrchestratorResult res = OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(responseText))
                        .executedToolCall(ToolCallDto.builder().name("recommend_budget_allocation").arguments(toolArgs).build())
                        .toolResult(toolResult)
                        .build();

                conversationMemoryService.addMessage(user, conversationId, "model", res.getResponseText());
                return res;
            }
        }

        // Deterministic handling for SPENDING_REDUCTION query
        if (intent == IntentRouter.AiIntent.SPENDING_REDUCTION) {
            state.setLastIntent(intent);
            conversationMemoryService.saveState(user, conversationId, state);

            AiTool txTool = findTool("get_monthly_spending");
            if (txTool != null) {
                Map<String, Object> toolArgs = Map.of("period", "MONTH");
                ToolResultDto toolResult = txTool.execute(user, toolArgs);
                Map<String, Object> data = toolResult.getData();
                long totalSpent = data != null && data.get("totalSpent") != null ? parseLong(data.get("totalSpent")) : 0L;

                String responseText;
                if (totalSpent <= 0) {
                    responseText = "Hiện tại SmartSpend chưa có dữ liệu chi tiêu thực tế trong khoảng thời gian này, nên chưa thể xác định khoản nào nên cắt giảm. Bạn hãy ghi nhận thêm các giao dịch chi tiêu, sau đó AI có thể phân tích danh mục chi lớn nhất để đề xuất khoản cần giảm.";
                } else {
                    Object topCategory = data != null ? data.get("topCategory") : null;
                    Object topCategoryAmount = data != null ? data.get("topCategoryAmount") : null;
                    DecimalFormat df = new DecimalFormat("#,###");

                    if (topCategory != null && topCategoryAmount != null) {
                        responseText = String.format("Dựa trên phân tích chi tiêu thực tế tháng này (%s VNĐ), bạn nên ưu tiên xem xét cắt giảm danh mục **%s** (đang chiếm chi phí cao nhất với **%s VNĐ**). Hạn chế các khoản chi không cấp thiết trong danh mục này sẽ giúp bạn tối ưu tài chính cá nhân.",
                                df.format(totalSpent), topCategory, df.format(parseLong(topCategoryAmount)));
                    } else {
                        responseText = String.format("Tổng chi tiêu tháng này của bạn là **%s VNĐ**. Bạn nên rà soát lại các khoản chi không thiết yếu để cắt giảm kịp thời.", df.format(totalSpent));
                    }
                }

                OrchestratorResult res = OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(responseText))
                        .executedToolCall(ToolCallDto.builder().name("get_monthly_spending").arguments(toolArgs).build())
                        .toolResult(toolResult)
                        .build();

                conversationMemoryService.addMessage(user, conversationId, "model", res.getResponseText());
                return res;
            }
        }

        // Deterministic handling for CREATE_TRANSACTION query
        if (intent == IntentRouter.AiIntent.CREATE_TRANSACTION) {
            state.setLastIntent(intent);
            conversationMemoryService.saveState(user, conversationId, state);

            long amount = amountParser.parse(userPrompt);
            String cleanDescr = userPrompt.replaceAll("(?i)\\b\\d+(?:[.,]\\d+)?\\s*(k|nghin|ngan|trieu|tr|m|ty)?\\b", "").trim();
            if (cleanDescr.isEmpty()) cleanDescr = "Giao dịch chi tiêu";

            DecimalFormat df = new DecimalFormat("#,###");
            String responseText = String.format("Bạn vừa thực hiện giao dịch **%s** với số tiền **%s VNĐ**. Vui lòng chọn danh mục và ví thanh toán để SmartSpend ghi nhận vào sổ thu chi.",
                    cleanDescr, df.format(amount > 0 ? amount : 50000L));

            OrchestratorResult res = OrchestratorResult.builder()
                    .responseText(TextNormalizer.normalizeWhitespace(responseText))
                    .executedToolCall(ToolCallDto.builder().name("create_transaction").arguments(Map.of("amount", amount, "description", cleanDescr)).build())
                    .build();

            conversationMemoryService.addMessage(user, conversationId, "model", res.getResponseText());
            return res;
        }

        // Deterministic handling for FINANCIAL_GOAL query (Context State Inheritance & Selective Updates)
        if (intent == IntentRouter.AiIntent.FINANCIAL_GOAL) {
            state.setLastIntent(intent);

            String norm = TextNormalizer.normalize(userPrompt);
            String parsedGoalName = amountParser.parseGoalName(userPrompt);

            boolean isMonthlySaving = amountParser.isMonthlySavingStatement(userPrompt);
            long parsedBalance = amountParser.parseUserDeclaredBalance(userPrompt);
            long parsedFund = amountParser.parseEmergencyFund(userPrompt);
            long explicitTarget = amountParser.parseTargetAmount(userPrompt);
            Boolean parsedUseBal = amountParser.parseUseCurrentBalance(userPrompt);
            DurationInfo parsedDurationInfo = dateResolverService.resolveDuration(userPrompt, LocalDate.now());

            log.error("===== STATE BEFORE MERGE =====");
            log.error("targetAmount={}", state.getTargetAmount());
            log.error("durationMonths={}", state.getDurationMonths());
            log.error("customMonthlySaving={}", state.getCustomMonthlySaving());
            log.error("useCurrentBalance={}", state.getUseCurrentBalance());

            log.error("===== PARSED ENTITIES =====");
            log.error("isMonthlySavingStatement={}", isMonthlySaving);
            log.error("explicitTarget={}", explicitTarget);
            log.error("parsedBalance={}", parsedBalance);
            log.error("parsedFund={}", parsedFund);
            log.error("parsedUseBal={}", parsedUseBal);

            // 1. Goal Name: ONLY update if user explicitly specifies a product/goal keyword
            if (parsedGoalName != null) {
                state.setGoalName(parsedGoalName);
            }

            // 2. Declared Balance & Emergency Fund: ONLY update if explicitly mentioned in prompt
            if (parsedBalance > 0) {
                state.setCurrentBalance(parsedBalance);
            }
            if (parsedFund > 0) {
                state.setEmergencyFund(parsedFund);
            }

            // 3. Use Current Balance flag
            if (parsedUseBal != null) {
                state.setUseCurrentBalance(parsedUseBal);
            }

            // 4. Custom Monthly Saving: ONLY update if prompt is a monthly saving capacity statement
            if (isMonthlySaving) {
                long monthlyAmt = amountParser.parse(userPrompt);
                if (monthlyAmt > 0) {
                    state.setCustomMonthlySaving(monthlyAmt);
                }
            }

            // 5. Target Amount Update Rule:
            // If user prompt provides a clear NEW target amount (explicitTarget > 0 && !isMonthlySaving), update state.targetAmount!
            // Otherwise, preserve existing targetAmount!
            if (explicitTarget > 0 && !isMonthlySaving) {
                state.setTargetAmount(explicitTarget);
            } else if (state.getTargetAmount() == null || state.getTargetAmount() <= 0) {
                long historyTarget = amountParser.parseTargetAmountFromHistory(history);
                if (historyTarget > 0) {
                    state.setTargetAmount(historyTarget);
                }
            }

            // 6. Duration & Operations (SET / ADD / SUBTRACT)
            if (parsedDurationInfo != null && parsedDurationInfo.getMonths() != null && parsedDurationInfo.getMonths() > 0) {
                int currentMonths = state.getDurationMonths() != null ? state.getDurationMonths() : 0;
                
                if (parsedDurationInfo.getOperation() == DurationInfo.DurationOperation.ADD) {
                    int newMonths = currentMonths + parsedDurationInfo.getMonths();
                    state.setDurationMonths(newMonths);
                    state.setOriginalDurationText(newMonths + " tháng");
                } else if (parsedDurationInfo.getOperation() == DurationInfo.DurationOperation.SUBTRACT) {
                    int newMonths = Math.max(1, currentMonths - parsedDurationInfo.getMonths());
                    state.setDurationMonths(newMonths);
                    state.setOriginalDurationText(newMonths + " tháng");
                } else {
                    // SET operation
                    state.setDurationMonths(parsedDurationInfo.getMonths());
                    state.setOriginalDurationText(parsedDurationInfo.getOriginalText());
                }
            }

            log.error("===== STATE AFTER MERGE =====");
            log.error("targetAmount={}", state.getTargetAmount());
            log.error("durationMonths={}", state.getDurationMonths());
            log.error("customMonthlySaving={}", state.getCustomMonthlySaving());
            log.error("useCurrentBalance={}", state.getUseCurrentBalance());
            log.error("=======================================");

            // Save updated state to Redis
            conversationMemoryService.saveState(user, conversationId, state);

            String goalName = state.getGoalName() != null ? state.getGoalName() : "mục tiêu tài chính";
            long targetAmount = state.getTargetAmount() != null ? state.getTargetAmount() : 0L;
            int durationMonths = state.getDurationMonths() != null ? state.getDurationMonths() : 0;
            String durationText = state.getOriginalDurationText() != null ? state.getOriginalDurationText() : (durationMonths > 0 ? durationMonths + " tháng" : "");

            // Parameter validation check
            if (targetAmount <= 0 && durationMonths <= 0) {
                OrchestratorResult res = OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(String.format("Bạn dự định mua %s khoảng bao nhiêu tiền và trong thời gian bao lâu?", goalName)))
                        .build();
                conversationMemoryService.addMessage(user, conversationId, "model", res.getResponseText());
                return res;
            }
            if (targetAmount <= 0) {
                OrchestratorResult res = OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(String.format("Bạn dự định mua %s khoảng bao nhiêu tiền?", goalName)))
                        .build();
                conversationMemoryService.addMessage(user, conversationId, "model", res.getResponseText());
                return res;
            }
            if (durationMonths <= 0) {
                OrchestratorResult res = OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(String.format("Bạn muốn hoàn thành mục tiêu mua %s trong thời gian bao lâu?", goalName)))
                        .build();
                conversationMemoryService.addMessage(user, conversationId, "model", res.getResponseText());
                return res;
            }

            // Execute CalculateSavingPlanTool with complete state
            AiTool goalTool = findTool("calculate_saving_plan");
            if (goalTool != null) {
                Map<String, Object> toolArgs = new HashMap<>();
                toolArgs.put("goalName", goalName);
                toolArgs.put("targetAmount", targetAmount);
                toolArgs.put("durationText", durationText);
                toolArgs.put("durationMonths", durationMonths);
                if (state.getCurrentBalance() != null && state.getCurrentBalance() > 0) {
                    toolArgs.put("declaredBalance", state.getCurrentBalance());
                }
                if (state.getEmergencyFund() != null && state.getEmergencyFund() > 0) {
                    toolArgs.put("emergencyFund", state.getEmergencyFund());
                }
                if (state.getCustomMonthlySaving() != null && state.getCustomMonthlySaving() > 0) {
                    toolArgs.put("customMonthlySaving", state.getCustomMonthlySaving());
                }
                if (state.getUseCurrentBalance() != null) {
                    toolArgs.put("useCurrentBalance", state.getUseCurrentBalance());
                }

                ToolResultDto toolResult = goalTool.execute(user, toolArgs);
                DecimalFormat df = new DecimalFormat("#,###");
                Map<String, Object> resData = toolResult.getData();

                boolean useBalance = state.getUseCurrentBalance() == null || state.getUseCurrentBalance();
                long balance = state.getCurrentBalance() != null ? state.getCurrentBalance() : 0L;
                long fund = state.getEmergencyFund() != null ? state.getEmergencyFund() : 0L;

                SavingPlan usingPlan = resData != null && resData.get("planWithBalance") != null ? (SavingPlan) resData.get("planWithBalance") : null;
                SavingPlan keepingPlan = resData != null && resData.get("planWithoutBalance") != null ? (SavingPlan) resData.get("planWithoutBalance") : null;
                SavingPlan activePlan = useBalance ? usingPlan : keepingPlan;

                long usable = activePlan != null ? activePlan.getInitialAmount() : (useBalance ? Math.max(0, balance - fund) : 0L);
                long requiredMonthly = activePlan != null ? activePlan.getMonthlySaving() : (long) Math.round((double) Math.max(0, targetAmount - usable) / Math.max(1, durationMonths));
                long customSaving = state.getCustomMonthlySaving() != null ? state.getCustomMonthlySaving() : 0L;

                StringBuilder sb = new StringBuilder();
                sb.append(String.format("🎯 **Mục tiêu**: Mua %s trị giá **%s VNĐ** trong **%s**.\n", goalName, df.format(targetAmount), durationText));

                if (balance > 0) {
                    sb.append(String.format("💰 **Tình hình hiện tại**:\n- Số dư hiện có: **%s VNĐ**\n", df.format(balance)));
                    if (!useBalance) {
                        sb.append(String.format("- ℹ️ *Theo yêu cầu của bạn, kế hoạch giữ nguyên số dư hiện tại và không khấu trừ khoản này vào mục tiêu mua %s.*\n", goalName));
                    } else if (fund > 0) {
                        sb.append(String.format("- Quỹ dự phòng giữ lại: **%s VNĐ**\n", df.format(fund)));
                        sb.append(String.format("- Số dư khả dụng dùng cho mục tiêu: **%s VNĐ**\n", df.format(usable)));
                    }
                }

                long remaining = Math.max(0, targetAmount - usable);

                if (customSaving > 0) {
                    long projected = usable + (customSaving * durationMonths);
                    long monthsNeeded = (long) Math.ceil((double) remaining / customSaving);
                    sb.append(String.format("\n📊 **Phân tích với hạn mức tiết kiệm đề xuất (%s VNĐ/tháng)**:\n", df.format(customSaving)));
                    sb.append(String.format("- **Khả năng tiết kiệm của bạn**: **%s VNĐ/tháng**\n", df.format(customSaving)));
                    sb.append(String.format("- **Mức tiết kiệm cần thiết (cho %d tháng)**: **%s VNĐ/tháng**\n", durationMonths, df.format(requiredMonthly)));

                    long monthlyDiff = customSaving - requiredMonthly;
                    if (monthlyDiff < 0) {
                        sb.append(String.format("- ⚠️ **Chênh lệch hàng tháng**: Thiếu **%s VNĐ/tháng** so với mức chuẩn.\n", df.format(Math.abs(monthlyDiff))));
                    } else {
                        sb.append(String.format("- 🎉 **Chênh lệch hàng tháng**: Dư **%s VNĐ/tháng** so với mức chuẩn!\n", df.format(monthlyDiff)));
                    }

                    sb.append(String.format("- **Dự kiến tích lũy sau %d tháng**: **%s VNĐ**\n", durationMonths, df.format(projected)));

                    if (projected >= targetAmount) {
                        sb.append(String.format("- 🎉 **Mục tiêu hoàn toàn đạt được!** (Dư **%s VNĐ**)\n", df.format(projected - targetAmount)));
                    } else {
                        sb.append(String.format("- ⚠️ **Chưa đủ target** (Thiếu **%s VNĐ**).\n", df.format(targetAmount - projected)));
                        sb.append(String.format("- **Thời gian cần thiết để đủ %s VNĐ**: **%d tháng** (Cần thêm %d tháng với mức %s VNĐ/tháng).\n",
                                df.format(targetAmount), monthsNeeded, Math.max(0, monthsNeeded - durationMonths), df.format(customSaving)));
                    }
                } else {
                    sb.append(String.format("\n📊 **Kế hoạch tiết kiệm tích lũy**:\n- Số tiền còn cần tích lũy: **%s VNĐ**\n- Thời gian: **%d tháng**\n- Cần tiết kiệm khoảng: **%s VNĐ/tháng**",
                            df.format(remaining), durationMonths, df.format(requiredMonthly)));
                }

                OrchestratorResult res = OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(sb.toString()))
                        .executedToolCall(ToolCallDto.builder().name("calculate_saving_plan").arguments(toolArgs).build())
                        .toolResult(toolResult)
                        .build();

                conversationMemoryService.addMessage(user, conversationId, "model", res.getResponseText());
                return res;
            }
        }

        // 4. Fall back to Gemini Function Calling for Open-Ended / General / Complex queries
        String systemPrompt = promptTemplateService.buildPrompt(user);
        OrchestratorResult result;

        try {
            List<Map<String, Object>> toolDeclarations = new ArrayList<>();
            Map<String, AiTool> toolMap = new HashMap<>();
            if (availableTools != null) {
                for (AiTool tool : availableTools) {
                    toolDeclarations.add(tool.getFunctionDeclaration());
                    toolMap.put(tool.getName(), tool);
                }
            }

            GeminiResponseDto turn1Res = chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .history(history)
                    .tools(toolDeclarations)
                    .call();

            if (!turn1Res.hasToolCalls()) {
                result = OrchestratorResult.builder()
                        .responseText(TextNormalizer.normalizeWhitespace(turn1Res.getText()))
                        .build();
            } else {
                List<ToolCallDto> requestedCalls = turn1Res.getToolCalls();
                List<ToolCallDto> executedToolCalls = new ArrayList<>();
                List<ToolResultDto> executedToolResults = new ArrayList<>();
                ToolResultDto promptUserResult = null;
                ToolCallDto promptUserCall = null;

                for (ToolCallDto toolCall : requestedCalls) {
                    log.info("[AI] LLM requested Tool Call: [{}] with args {}", toolCall.getName(), toolCall.getArguments());
                    AiTool toolToRun = toolMap.get(toolCall.getName());
                    if (toolToRun == null) {
                        log.warn("[AI] Tool [{}] not found in availableTools", toolCall.getName());
                        continue;
                    }

                    ToolResultDto toolResult = toolToRun.execute(user, toolCall.getArguments());
                    log.info("[AI] Tool [{}] execution result success={}", toolCall.getName(), toolResult.isSuccess());

                    executedToolCalls.add(toolCall);
                    executedToolResults.add(toolResult);

                    if (!toolResult.isSuccess() && toolResult.getData() != null && toolResult.getData().containsKey("promptUser")) {
                        promptUserResult = toolResult;
                        promptUserCall = toolCall;
                    }
                }

                if (executedToolCalls.isEmpty()) {
                    result = OrchestratorResult.builder()
                            .responseText(TextNormalizer.normalizeWhitespace(turn1Res.getText()))
                            .build();
                } else if (promptUserResult != null) {
                    String promptUserMsg = (String) promptUserResult.getData().get("promptUser");
                    result = OrchestratorResult.builder()
                            .responseText(TextNormalizer.normalizeWhitespace(promptUserMsg))
                            .executedToolCall(promptUserCall)
                            .toolResult(promptUserResult)
                            .build();
                } else {
                    String finalAnswer = chatClient.prompt()
                            .system(systemPrompt)
                            .user(userPrompt)
                            .history(history)
                            .sendToolResults(executedToolCalls, executedToolResults);

                    result = OrchestratorResult.builder()
                            .responseText(TextNormalizer.normalizeWhitespace(finalAnswer))
                            .executedToolCall(executedToolCalls.get(0))
                            .toolResult(executedToolResults.get(0))
                            .build();
                }
            }

        } catch (Exception e) {
            log.warn("[AI] LLM remote API unconfigured or failed ({}), invoking local fallback router.", e.getMessage());
            result = fallbackRouter.handleFallback(user, userPrompt, history, e);
        }

        if (result != null && result.getResponseText() != null) {
            result.setResponseText(TextNormalizer.normalizeWhitespace(result.getResponseText()));
        }

        if (result != null && result.getResponseText() != null && !result.getResponseText().isEmpty()) {
            conversationMemoryService.addMessage(user, conversationId, "model", result.getResponseText());
        }

        return result;
    }

    private AiTool findTool(String toolName) {
        if (availableTools == null) return null;
        return availableTools.stream()
                .filter(t -> toolName.equals(t.getName()))
                .findFirst()
                .orElse(null);
    }

    private long parseLong(Object obj) {
        if (obj == null) return 0L;
        if (obj instanceof Number) return ((Number) obj).longValue();
        try {
            return Long.parseLong(obj.toString());
        } catch (Exception e) {
            return 0L;
        }
    }
}
