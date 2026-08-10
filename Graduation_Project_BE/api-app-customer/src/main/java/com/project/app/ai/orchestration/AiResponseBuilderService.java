package com.project.app.ai.orchestration;

import com.project.app.ai.dto.response.*;
import com.project.app.ai.enums.AiModuleType;
import com.project.app.ai.tool.dto.ToolResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.DecimalFormat;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiResponseBuilderService {

    public AiChatResponse buildResponse(String conversationId, AiOrchestrator.OrchestratorResult result) {
        List<AiCardDto> cards = new ArrayList<>();
        AiModuleType moduleType = AiModuleType.GENERAL;

        if (result != null && result.getToolResult() != null && result.getToolResult().isSuccess()) {
            ToolResultDto toolResult = result.getToolResult();
            moduleType = mapToolNameToModuleType(toolResult.getToolName());

            AiCardDto card = buildCardFromToolResult(toolResult);
            if (card != null) {
                cards.add(card);
            }
        }

        AiActionPromptDto actionPrompt = buildActionPrompt(moduleType);

        return AiChatResponse.builder()
                .id(conversationId)
                .text(result != null ? result.getResponseText() : "")
                .moduleType(moduleType)
                .timestamp(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")))
                .cards(cards)
                .actionPrompt(actionPrompt)
                .build();
    }

    private AiModuleType mapToolNameToModuleType(String toolName) {
        if ("calculate_saving_plan".equals(toolName)) {
            return AiModuleType.FINANCIAL_GOAL;
        } else if ("recommend_budget_allocation".equals(toolName)) {
            return AiModuleType.RECOMMENDATION;
        } else if ("get_monthly_spending".equals(toolName) || "get_transaction_summary".equals(toolName)) {
            return AiModuleType.ANALYTICS;
        } else if ("get_wallets_and_balance".equals(toolName)) {
            return AiModuleType.ANALYTICS;
        } else if ("search_app_guide".equals(toolName) || "get_app_guide".equals(toolName)) {
            return AiModuleType.APP_GUIDE;
        }
        return AiModuleType.GENERAL;
    }

    private AiCardDto buildCardFromToolResult(ToolResultDto toolResult) {
        if (toolResult == null || toolResult.getData() == null) return null;
        DecimalFormat df = new DecimalFormat("#,###");

        Map<String, Object> data = toolResult.getData();

        if ("recommend_budget_allocation".equals(toolResult.getToolName())) {
            List<AiCardItemDto> items = new ArrayList<>();
            Object incomeObj = data.get("income");
            Object fixedObj = data.get("fixedExpenses");
            Object essentialObj = data.get("essentialTarget");
            if (essentialObj == null) essentialObj = data.get("essential50");
            Object personalObj = data.get("personalTarget");
            if (personalObj == null) personalObj = data.get("personal30");
            Object savingObj = data.get("savingTarget");
            if (savingObj == null) savingObj = data.get("saving20");

            if (incomeObj != null) {
                items.add(AiCardItemDto.builder()
                        .label("Tổng thu nhập")
                        .value(df.format(parseToLong(incomeObj)) + " VNĐ")
                        .color("#3B82F6")
                        .build());
            }
            if (fixedObj != null && parseToLong(fixedObj) > 0) {
                items.add(AiCardItemDto.builder()
                        .label("Chi phí nhà/cố định")
                        .value(df.format(parseToLong(fixedObj)) + " VNĐ")
                        .color("#EF4444")
                        .build());
            }
            if (essentialObj != null) {
                items.add(AiCardItemDto.builder()
                        .label("Nhu cầu thiết yếu (50%)")
                        .value(df.format(parseToLong(essentialObj)) + " VNĐ")
                        .build());
            }
            if (savingObj != null) {
                items.add(AiCardItemDto.builder()
                        .label("Tiết kiệm & Tích lũy (20%)")
                        .value(df.format(parseToLong(savingObj)) + " VNĐ")
                        .color("#10B981")
                        .build());
            }
            if (personalObj != null) {
                items.add(AiCardItemDto.builder()
                        .label("Chi tiêu cá nhân (30%)")
                        .value(df.format(parseToLong(personalObj)) + " VNĐ")
                        .build());
            }

            return AiCardDto.builder()
                    .type("BUDGET_PLAN")
                    .title("Phân bổ ngân sách 50/30/20")
                    .items(items)
                    .build();

        } else if ("calculate_saving_plan".equals(toolResult.getToolName())) {
            List<AiCardItemDto> items = new ArrayList<>();
            String goalName = (String) data.getOrDefault("goalName", "Mục tiêu");
            Object targetAmtObj = data.get("targetAmount");
            Object durationTextObj = data.get("durationText");
            Object customSavingObj = data.get("customMonthlySaving");
            Boolean useBal = (Boolean) data.get("useCurrentBalance");

            if (targetAmtObj != null) {
                items.add(AiCardItemDto.builder()
                        .label("Mục tiêu")
                        .value(df.format(parseToLong(targetAmtObj)) + " VNĐ")
                        .build());
            }

            if (durationTextObj != null) {
                items.add(AiCardItemDto.builder()
                        .label("Thời gian")
                        .value(durationTextObj.toString())
                        .build());
            }

            Object planObj = (useBal == null || useBal) ? data.get("planWithBalance") : data.get("planWithoutBalance");
            if (planObj == null) {
                planObj = data.get("planWithoutBalance");
            }

            long monthlySaving = 0L;
            if (planObj instanceof com.project.app.ai.dto.internal.SavingPlan) {
                monthlySaving = ((com.project.app.ai.dto.internal.SavingPlan) planObj).getMonthlySaving();
            } else if (planObj instanceof Map) {
                Map<?, ?> planMap = (Map<?, ?>) planObj;
                monthlySaving = parseToLong(planMap.get("monthlySaving"));
            }

            long customSavingVal = parseToLong(customSavingObj);
            if (customSavingVal > 0) {
                items.add(AiCardItemDto.builder()
                        .label("Khả năng tiết kiệm")
                        .value(df.format(customSavingVal) + " VNĐ/tháng")
                        .color("#3B82F6")
                        .build());

                items.add(AiCardItemDto.builder()
                        .label("Mức cần thiết chuẩn")
                        .value(df.format(monthlySaving) + " VNĐ/tháng")
                        .color("#10B981")
                        .build());
            } else if (monthlySaving > 0) {
                items.add(AiCardItemDto.builder()
                        .label("Cần tiết kiệm/tháng")
                        .value(df.format(monthlySaving) + " VNĐ/tháng")
                        .color("#10B981")
                        .build());
            }

            return AiCardDto.builder()
                    .type("GOAL_PLAN")
                    .title("Kế hoạch: " + goalName)
                    .items(items)
                    .build();

        } else if ("get_monthly_spending".equals(toolResult.getToolName()) || "get_transaction_summary".equals(toolResult.getToolName())) {
            List<AiCardItemDto> items = new ArrayList<>();
            Object totalSpentObj = data.get("totalSpent");
            if (totalSpentObj == null) {
                totalSpentObj = data.get("totalExpense");
            }
            Object topCategory = data.get("topCategory");
            Object topCategoryAmount = data.get("topCategoryAmount");

            String period = (String) data.getOrDefault("timeRange", data.getOrDefault("period", "MONTH"));
            String periodLabel = "Tổng chi tiêu";
            if ("TODAY".equalsIgnoreCase(period) || "DAY".equalsIgnoreCase(period)) {
                periodLabel = "Tổng chi hôm nay";
            } else if ("YESTERDAY".equalsIgnoreCase(period)) {
                periodLabel = "Tổng chi hôm qua";
            } else if ("WEEK".equalsIgnoreCase(period)) {
                periodLabel = "Tổng chi tuần này";
            } else if ("MONTH".equalsIgnoreCase(period)) {
                periodLabel = "Tổng chi tháng này";
            } else if ("YEAR".equalsIgnoreCase(period)) {
                periodLabel = "Tổng chi năm nay";
            }

            if (totalSpentObj != null) {
                items.add(AiCardItemDto.builder()
                        .label(periodLabel)
                        .value(df.format(parseToLong(totalSpentObj)) + " VNĐ")
                        .color("#EF4444")
                        .build());
            }

            if (topCategory != null && topCategoryAmount != null) {
                items.add(AiCardItemDto.builder()
                        .label("Chi nhiều nhất (" + topCategory + ")")
                        .value(df.format(parseToLong(topCategoryAmount)) + " VNĐ")
                        .build());
            }

            return AiCardDto.builder()
                    .type("METRICS")
                    .title("Thống kê chi tiêu")
                    .items(items)
                    .build();

        } else if ("get_wallets_and_balance".equals(toolResult.getToolName())) {
            List<AiCardItemDto> items = new ArrayList<>();
            Object totalBalObj = data.get("totalBalance");
            Object walletCount = data.get("walletCount");

            if (totalBalObj != null) {
                items.add(AiCardItemDto.builder()
                        .label("Tổng số dư ví")
                        .value(df.format(parseToLong(totalBalObj)) + " VNĐ")
                        .color("#3B82F6")
                        .build());
            }
            if (walletCount != null) {
                items.add(AiCardItemDto.builder()
                        .label("Số lượng ví")
                        .value(walletCount.toString() + " ví")
                        .build());
            }

            return AiCardDto.builder()
                    .type("METRICS")
                    .title("Thông tin Ví tài khoản")
                    .items(items)
                    .build();
        }

        return null;
    }

    private AiActionPromptDto buildActionPrompt(AiModuleType moduleType) {
        if (AiModuleType.FINANCIAL_GOAL.equals(moduleType)) {
            return AiActionPromptDto.builder()
                    .question("Bạn muốn điều chỉnh kế hoạch?")
                    .actions(List.of(
                            AiActionItemDto.builder().label("Nâng số tiền tiết kiệm hàng tháng").prompt("Nếu mỗi tháng tôi tiết kiệm nhiều hơn thì sao?").build(),
                            AiActionItemDto.builder().label("Không sử dụng số dư hiện tại").prompt("Nếu tôi giữ nguyên số dư hiện tại thì sao?").build()
                    ))
                    .build();
        } else if (AiModuleType.ANALYTICS.equals(moduleType)) {
            return AiActionPromptDto.builder()
                    .question("Khám phá thêm:")
                    .actions(List.of(
                            AiActionItemDto.builder().label("Xem chi tiết các ví").prompt("Ví của tôi hiện có bao nhiêu tiền?").build(),
                            AiActionItemDto.builder().label("Lên kế hoạch mua sắm").prompt("Tôi muốn tiết kiệm mua điện thoại").build()
                    ))
                    .build();
        }

        return AiActionPromptDto.builder()
                .question("Gợi ý cho bạn:")
                .actions(List.of(
                        AiActionItemDto.builder().label("Phân tích thu chi tháng này").prompt("Tháng này tôi tiêu bao nhiêu?").build(),
                        AiActionItemDto.builder().label("Lập kế hoạch mua xe 300 tr").prompt("Tôi muốn mua ô tô 300 triệu trong 9 tháng").build()
                ))
                .build();
    }

    private long parseToLong(Object obj) {
        if (obj == null) return 0L;
        if (obj instanceof Number) return ((Number) obj).longValue();
        try {
            return Long.parseLong(obj.toString());
        } catch (Exception e) {
            return 0L;
        }
    }
}
