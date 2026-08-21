package com.project.app.ai.orchestration;

import com.project.app.ai.category.CategoryCreateService;
import com.project.app.ai.client.GeminiClient;
import com.project.app.ai.dto.response.AiActionDto;
import com.project.app.ai.dto.response.AiCardDto;
import com.project.app.ai.client.dto.GeminiResponseDto;
import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import com.project.app.ai.finance.FinanceIntent;
import com.project.app.ai.finance.FinanceIntentRouter;
import com.project.app.ai.finance.FinanceResponseBuilder;
import com.project.app.ai.prompt.SystemPrompt;
import com.project.app.ai.routing.CategoryIntentRouter;
import com.project.app.ai.tool.AiTool;
import com.project.app.ai.tool.GetFinanceCenterSummaryTool;
import com.project.app.ai.tool.GetBudgetStatusTool;
import com.project.app.ai.tool.GetSpendingByCategoryTool;
import com.project.app.ai.tool.dto.ToolCallDto;
import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.user.entity.User;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiOrchestrator {

    private final GeminiClient geminiClient;
    private final SystemPrompt systemPrompt;
    private final CategoryIntentRouter categoryIntentRouter;
    private final FinanceIntentRouter financeIntentRouter;
    private final FinanceResponseBuilder financeResponseBuilder;
    private final GetFinanceCenterSummaryTool financeCenterSummaryTool;
    private final GetSpendingByCategoryTool spendingByCategoryTool;
    private final GetBudgetStatusTool budgetStatusTool;
    private final AiResponseBuilderService responseBuilder;
    private final List<AiTool> tools;
    private final CategoryCreateService categoryCreateService;

    @Data
    @Builder
    public static class OrchestratorResult {
        private String responseText;
        private String moduleType;
        private ToolResultDto toolResult;
        private List<AiCardDto> cards;
        private List<AiActionDto> actions;
    }

    public OrchestratorResult process(
            User user,
            String message,
            List<ChatMessageHistoryDto> history) {

        Optional<CategoryCreateService.CategoryCreateResult> createResult =
                categoryCreateService.handle(user, message);
        if (createResult.isPresent()) {
            CategoryCreateService.CategoryCreateResult result = createResult.get();
            return OrchestratorResult.builder()
                    .responseText(result.getText())
                    .moduleType(result.getModuleType())
                    .cards(result.getCards())
                    .actions(result.getActions())
                    .build();
        }
        FinanceIntentRouter.FinanceRoute financeRoute = financeIntentRouter.detect(message);
        if (financeRoute.intent() != FinanceIntent.NONE) {
            return buildFinanceResult(user, financeRoute);
        }

        CategoryIntentRouter.CategoryIntent categoryIntent = categoryIntentRouter.detect(message);
        AiTool listTool = findTool("list_user_categories");

        if (listTool != null && categoryIntent == CategoryIntentRouter.CategoryIntent.LIST) {
            return buildListResult(user, listTool, CategoryIntentRouter.CategoryIntent.LIST);
        }

        if (listTool != null && categoryIntent == CategoryIntentRouter.CategoryIntent.SPENDING_TYPES) {
            return buildListResult(user, listTool, CategoryIntentRouter.CategoryIntent.SPENDING_TYPES);
        }

        if (categoryIntent == CategoryIntentRouter.CategoryIntent.GUIDE) {
            return OrchestratorResult.builder()
                    .responseText(responseBuilder.buildCategoryGuideText())
                    .moduleType("CATEGORY")
                    .build();
        }

        return processWithGemini(user, message, history);
    }

    private OrchestratorResult buildFinanceResult(User user, FinanceIntentRouter.FinanceRoute route) {
        FinanceIntent intent = route.intent();

        if (intent == FinanceIntent.GUIDE) {
            return OrchestratorResult.builder()
                    .responseText(financeResponseBuilder.buildGuideText())
                    .moduleType("FINANCE")
                    .actions(financeResponseBuilder.buildNavigateActions(intent))
                    .build();
        }

        if (intent == FinanceIntent.FUND_BALANCE) {
            return OrchestratorResult.builder()
                    .responseText(financeResponseBuilder.buildOutOfScopeText(intent))
                    .moduleType("FINANCE")
                    .actions(financeResponseBuilder.buildNavigateActions(intent))
                    .build();
        }

        ToolResultDto toolResult = executeFinanceTool(user, route);
        toolResult = financeResponseBuilder.tagIntent(toolResult, intent);

        String text = financeResponseBuilder.buildText(intent, toolResult);
        AiCardDto card = financeResponseBuilder.buildCard(intent, toolResult);

        return OrchestratorResult.builder()
                .responseText(text)
                .moduleType("FINANCE")
                .toolResult(toolResult.isSuccess() ? toolResult : null)
                .cards(card != null ? List.of(card) : null)
                .actions(financeResponseBuilder.buildNavigateActions(intent))
                .build();
    }

    private ToolResultDto executeFinanceTool(User user, FinanceIntentRouter.FinanceRoute route) {
        FinanceIntent intent = route.intent();
        if (intent == FinanceIntent.SPENDING_BY_CATEGORY) {
            return spendingByCategoryTool.execute(user, route.period(), false);
        }
        if (intent == FinanceIntent.SPENDING_BY_CATEGORY_COMPARE) {
            return spendingByCategoryTool.execute(user, route.period(), true);
        }
        if (intent == FinanceIntent.BUDGET_STATUS) {
            return budgetStatusTool.execute(user, Collections.emptyMap());
        }
        return financeCenterSummaryTool.execute(user, route.period());
    }

    private OrchestratorResult buildListResult(
            User user,
            AiTool listTool,
            CategoryIntentRouter.CategoryIntent style) {

        ToolResultDto toolResult = tagResult(
                listTool.execute(user, Collections.emptyMap()),
                style);

        String text = style == CategoryIntentRouter.CategoryIntent.SPENDING_TYPES
                ? responseBuilder.buildSpendingTypesText(toolResult)
                : responseBuilder.buildListCategoriesText(toolResult);

        return OrchestratorResult.builder()
                .responseText(text)
                .moduleType("CATEGORY")
                .toolResult(toolResult)
                .build();
    }

    private OrchestratorResult processWithGemini(
            User user,
            String message,
            List<ChatMessageHistoryDto> history) {

        List<Map<String, Object>> toolDeclarations = tools.stream()
                .map(AiTool::getFunctionDeclaration)
                .toList();

        try {
            GeminiResponseDto turn1 = geminiClient.chatWithTools(
                    systemPrompt.build(user),
                    message,
                    history,
                    toolDeclarations);

            if (turn1.hasToolCalls()) {
                ToolCallDto toolCall = turn1.getToolCalls().get(0);
                AiTool tool = findTool(toolCall.getName());
                if (tool != null) {
                    Map<String, Object> args = toolCall.getArguments() != null
                            ? toolCall.getArguments()
                            : Collections.emptyMap();
                    ToolResultDto toolResult = tool.execute(user, args);

                    String finalText;
                    if ("list_user_categories".equals(tool.getName()) && toolResult.isSuccess()) {
                        CategoryIntentRouter.CategoryIntent style =
                                categoryIntentRouter.isSpendingTypesQuestion(message)
                                        ? CategoryIntentRouter.CategoryIntent.SPENDING_TYPES
                                        : CategoryIntentRouter.CategoryIntent.LIST;
                        toolResult = tagResult(toolResult, style);
                        finalText = style == CategoryIntentRouter.CategoryIntent.SPENDING_TYPES
                                ? responseBuilder.buildSpendingTypesText(toolResult)
                                : responseBuilder.buildListCategoriesText(toolResult);
                    } else if (isFinanceDataTool(tool.getName()) && toolResult.isSuccess()) {
                        FinanceIntent intent = resolveFinanceIntent(message, toolResult);
                        toolResult = financeResponseBuilder.tagIntent(toolResult, intent);
                        finalText = financeResponseBuilder.buildText(intent, toolResult);
                    } else {
                        finalText = geminiClient.continueWithToolResult(
                                systemPrompt.build(user),
                                message,
                                history,
                                toolCall,
                                toolResult);
                        if (finalText == null || finalText.isBlank()) {
                            finalText = toolResult.getMessage() != null
                                    ? toolResult.getMessage()
                                    : "Đã xử lý yêu cầu của bạn.";
                        }
                    }

                    List<AiCardDto> cards = null;
                    List<AiActionDto> actions = null;
                    if (isFinanceDataTool(tool.getName()) && toolResult.isSuccess()) {
                        FinanceIntent intent = resolveFinanceIntent(message, toolResult);
                        AiCardDto card = financeResponseBuilder.buildCard(intent, toolResult);
                        if (card != null) {
                            cards = List.of(card);
                        }
                        actions = financeResponseBuilder.buildNavigateActions(intent);
                    }

                    return OrchestratorResult.builder()
                            .responseText(finalText)
                            .moduleType(mapModuleType(tool.getName()))
                            .toolResult(toolResult.isSuccess() ? toolResult : null)
                            .cards(cards)
                            .actions(actions)
                            .build();
                }
            }

            String text = turn1.getText();
            if (text == null || text.isBlank()) {
                text = "Xin lỗi, tôi chưa tạo được câu trả lời. Bạn thử hỏi lại nhé.";
            }

            return OrchestratorResult.builder()
                    .responseText(text)
                    .moduleType("GENERAL")
                    .build();
        } catch (Exception e) {
            log.error("Gemini orchestration failed: {}", e.getMessage());
            throw e;
        }
    }

    private FinanceIntent resolveFinanceIntent(String message, ToolResultDto toolResult) {
        if (toolResult.getData() != null && toolResult.getData().get("financeIntent") != null) {
            try {
                return FinanceIntent.valueOf(toolResult.getData().get("financeIntent").toString());
            } catch (IllegalArgumentException ignored) {
                // fall through
            }
        }
        FinanceIntent fromTool = financeResponseBuilder.resolveIntent(message, toolResult);
        if (fromTool != FinanceIntent.PERIOD_OVERVIEW) {
            return fromTool;
        }
        FinanceIntentRouter.FinanceRoute route = financeIntentRouter.detect(message);
        return route.intent() != FinanceIntent.NONE ? route.intent() : FinanceIntent.PERIOD_OVERVIEW;
    }

    private boolean isFinanceDataTool(String toolName) {
        return "get_finance_center_summary".equals(toolName)
                || "get_spending_by_category".equals(toolName)
                || "get_budget_status".equals(toolName);
    }

    private ToolResultDto tagResult(
            ToolResultDto toolResult,
            CategoryIntentRouter.CategoryIntent style) {

        if (toolResult == null || toolResult.getData() == null) {
            return toolResult;
        }

        Map<String, Object> data = new HashMap<>(toolResult.getData());
        data.put("responseStyle", style.name());
        return ToolResultDto.builder()
                .toolName(toolResult.getToolName())
                .success(toolResult.isSuccess())
                .message(toolResult.getMessage())
                .data(data)
                .build();
    }

    private AiTool findTool(String name) {
        if (name == null || tools == null) {
            return null;
        }
        Map<String, AiTool> byName = tools.stream()
                .collect(Collectors.toMap(AiTool::getName, Function.identity(), (a, b) -> a));
        return byName.get(name);
    }

    private String mapModuleType(String toolName) {
        if ("list_user_categories".equals(toolName)) {
            return "CATEGORY";
        }
        if ("get_finance_center_summary".equals(toolName)) {
            return "FINANCE";
        }
        if ("get_spending_by_category".equals(toolName) || "get_budget_status".equals(toolName)) {
            return "FINANCE";
        }
        return "GENERAL";
    }
}
