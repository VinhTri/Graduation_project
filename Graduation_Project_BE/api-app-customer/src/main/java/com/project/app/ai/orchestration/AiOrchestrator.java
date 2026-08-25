package com.project.app.ai.orchestration;

import com.project.app.ai.category.CategoryCreateService;
import com.project.app.ai.advisory.FinancialMathAdvisoryService;
import com.project.app.ai.client.GeminiClient;
import com.project.app.ai.dto.response.AiActionDto;
import com.project.app.ai.dto.response.AiCardDto;
import com.project.app.ai.client.dto.GeminiResponseDto;
import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import com.project.app.ai.finance.FinanceIntent;
import com.project.app.ai.finance.FinanceIntentRouter;
import com.project.app.ai.finance.FinanceResponseBuilder;
import com.project.app.ai.knowledge.AppKnowledgeService;
import com.project.app.ai.prompt.SystemPrompt;
import com.project.app.ai.query.DynamicDataQueryService;
import com.project.app.ai.routing.CategoryIntentRouter;
import com.project.app.ai.security.AiSecurityPolicyService;
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
import java.text.Normalizer;
import java.util.Locale;

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
    private final AiSafeActionService safeActionService;
    private final AppKnowledgeService appKnowledgeService;
    private final DynamicDataQueryService dynamicDataQueryService;
    private final FinancialMathAdvisoryService financialMathAdvisoryService;
    private final AiSecurityPolicyService securityPolicyService;

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

        String routingMessage = contextualizeFollowUp(message, history);

        // Guardrails must run before data queries, actions, tools and the LLM.
        Optional<AiSecurityPolicyService.SecurityDecision> security = securityPolicyService.evaluate(message);
        if (security.isPresent()) {
            AiSecurityPolicyService.SecurityDecision decision = security.get();
            return OrchestratorResult.builder()
                    .responseText(decision.text())
                    .moduleType(decision.moduleType())
                    .build();
        }

        // Personal-data queries must win over static guidance when phrases overlap
        // (for example "hóa đơn nào sắp đến hạn" vs "hóa đơn nhắc hạn là gì").
        Optional<DynamicDataQueryService.QueryAnswer> dynamic = dynamicDataQueryService.query(user, routingMessage);
        if (dynamic.isPresent()) {
            DynamicDataQueryService.QueryAnswer answer = dynamic.get();
            return OrchestratorResult.builder()
                    .responseText(answer.text())
                    .moduleType(answer.moduleType())
                    .toolResult(answer.toolResult())
                    .build();
        }

        Optional<FinancialMathAdvisoryService.AdvisoryAnswer> advisory =
                financialMathAdvisoryService.advise(user, routingMessage);
        if (advisory.isPresent()) {
            FinancialMathAdvisoryService.AdvisoryAnswer answer = advisory.get();
            return OrchestratorResult.builder()
                    .responseText(answer.text())
                    .moduleType("RECOMMENDATION")
                    .actions(answer.actions())
                    .build();
        }

        Optional<AppKnowledgeService.KnowledgeAnswer> knowledge = appKnowledgeService.findAnswer(routingMessage);
        if (knowledge.isPresent()) {
            AppKnowledgeService.KnowledgeAnswer answer = knowledge.get();
            String responseText = adaptKnowledgeAnswer(user, message, history, answer);
            return OrchestratorResult.builder()
                    .responseText(responseText)
                    .moduleType(answer.moduleType())
                    .build();
        }

        Optional<AiSafeActionService.Result> safeAction = safeActionService.handle(user, message);
        if (safeAction.isPresent()) {
            AiSafeActionService.Result result = safeAction.get();
            return OrchestratorResult.builder().responseText(result.getText()).moduleType(result.getModuleType())
                    .cards(result.getCards()).actions(result.getActions()).build();
        }
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
        FinanceIntentRouter.FinanceRoute financeRoute = financeIntentRouter.detect(routingMessage);
        if (financeRoute.intent() != FinanceIntent.NONE) {
            return buildFinanceResult(user, financeRoute);
        }

        CategoryIntentRouter.CategoryIntent categoryIntent = categoryIntentRouter.detect(routingMessage);
        AiTool listTool = findTool("list_user_categories");

        if (listTool != null && categoryIntent == CategoryIntentRouter.CategoryIntent.LIST) {
            return buildListResult(user, listTool, CategoryIntentRouter.CategoryIntent.LIST);
        }

        if (listTool != null && categoryIntent == CategoryIntentRouter.CategoryIntent.SPENDING_TYPES) {
            return buildListResult(user, listTool, CategoryIntentRouter.CategoryIntent.SPENDING_TYPES);
        }

        if (listTool != null && categoryIntent == CategoryIntentRouter.CategoryIntent.INCOME_TYPES) {
            return buildListResult(user, listTool, CategoryIntentRouter.CategoryIntent.INCOME_TYPES);
        }

        if (categoryIntent == CategoryIntentRouter.CategoryIntent.GUIDE) {
            return OrchestratorResult.builder()
                    .responseText(responseBuilder.buildCategoryGuideText())
                    .moduleType("CATEGORY")
                    .build();
        }

        return processWithGemini(user, message, history);
    }

    private String contextualizeFollowUp(String message, List<ChatMessageHistoryDto> history) {
        if (message == null || history == null || history.isEmpty()) return message;
        String normalized = normalizeForContext(message);
        boolean followUp = normalized.length() <= 80 && (
                normalized.contains("roi ma")
                        || normalized.startsWith("the ")
                        || normalized.startsWith("vay ")
                        || normalized.startsWith("con ")
                        || normalized.startsWith("neu ")
                        || normalized.contains("thi sao")
                        || normalized.contains("bao nhieu roi")
                        || normalized.contains("cua no")
                        || normalized.contains("danh muc do")
                        || normalized.contains("quy do")
                        || normalized.contains("hoa don do"));
        if (!followUp) return message;

        for (int i = history.size() - 1; i >= 0; i--) {
            ChatMessageHistoryDto previous = history.get(i);
            if (previous != null && "user".equalsIgnoreCase(previous.getRole())
                    && previous.getContent() != null && !previous.getContent().isBlank()) {
                return previous.getContent().trim() + "\nCâu hỏi nối tiếp: " + message.trim();
            }
        }
        return message;
    }

    private String normalizeForContext(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replace('đ', 'd')
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
    }

    private String adaptKnowledgeAnswer(
            User user,
            String message,
            List<ChatMessageHistoryDto> history,
            AppKnowledgeService.KnowledgeAnswer answer) {
        // Security thresholds and calculations must remain exact and deterministic.
        if ("PIN_LOCKOUT".equals(answer.id())) {
            return answer.text();
        }
        if (!geminiClient.isConfigured()) {
            return answer.text();
        }
        String adaptivePrompt = systemPrompt.build(user) + """

                NGỮ CẢNH SMARTSPEND ĐÃ TRUY XUẤT:
                %s

                Hãy trả lời đúng câu hỏi hiện tại dựa trên ngữ cảnh trên. Không sao chép máy móc toàn bộ đoạn tham chiếu:
                chọn đúng ý người dùng cần, liên hệ lịch sử hội thoại nếu có, thay đổi mức chi tiết theo cách họ hỏi,
                và hỏi lại một câu ngắn nếu còn thiếu dữ kiện quan trọng. Không thêm chức năng không có trong ngữ cảnh.
                """.formatted(answer.text());
        try {
            String generated = geminiClient.chat(adaptivePrompt, message, history);
            return generated == null || generated.isBlank() ? answer.text() : generated;
        } catch (Exception exception) {
            log.warn("Could not adapt knowledge answer {}, using verified fallback: {}", answer.id(), exception.getMessage());
            return answer.text();
        }
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
        if (intent == FinanceIntent.SPENDING_BY_CATEGORY || intent == FinanceIntent.SPENDING_ANALYSIS) {
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

        String categoryType = style == CategoryIntentRouter.CategoryIntent.INCOME_TYPES ? "INCOME"
                : style == CategoryIntentRouter.CategoryIntent.SPENDING_TYPES ? "EXPENSE" : "ALL";
        ToolResultDto toolResult = tagResult(
                listTool.execute(user, Map.of("categoryType", categoryType)),
                style);

        String text = switch (style) {
            case SPENDING_TYPES -> responseBuilder.buildSpendingTypesText(toolResult);
            case INCOME_TYPES -> responseBuilder.buildIncomeTypesText(toolResult);
            default -> responseBuilder.buildListCategoriesText(toolResult);
        };

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
                        CategoryIntentRouter.CategoryIntent detectedStyle = categoryIntentRouter.detect(message);
                        CategoryIntentRouter.CategoryIntent style =
                                detectedStyle == CategoryIntentRouter.CategoryIntent.SPENDING_TYPES
                                        || detectedStyle == CategoryIntentRouter.CategoryIntent.INCOME_TYPES
                                        ? detectedStyle : CategoryIntentRouter.CategoryIntent.LIST;
                        String requestedType = style == CategoryIntentRouter.CategoryIntent.INCOME_TYPES
                                ? "INCOME" : style == CategoryIntentRouter.CategoryIntent.SPENDING_TYPES ? "EXPENSE" : "ALL";
                        toolResult = listToolResultForType(tool, user, requestedType, toolResult);
                        toolResult = tagResult(toolResult, style);
                        finalText = style == CategoryIntentRouter.CategoryIntent.SPENDING_TYPES
                                ? responseBuilder.buildSpendingTypesText(toolResult)
                                : style == CategoryIntentRouter.CategoryIntent.INCOME_TYPES
                                ? responseBuilder.buildIncomeTypesText(toolResult)
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

    private ToolResultDto listToolResultForType(
            AiTool tool, User user, String requestedType, ToolResultDto currentResult) {
        if ("ALL".equals(requestedType)) return currentResult;
        return tool.execute(user, Map.of("categoryType", requestedType));
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
