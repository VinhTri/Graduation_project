package com.project.app.ai.tool;

import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.text.DecimalFormat;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class BudgetTool implements AiTool {

    @Override
    public String getName() {
        return "recommend_budget_allocation";
    }

    @Override
    public String getDescription() {
        return "Tư vấn và lập kế hoạch phân bổ ngân sách thu chi cá nhân (quy tắc 50/30/20 hoặc phân bổ tùy chỉnh) dựa trên tổng thu nhập và chi tiêu của người dùng.";
    }

    @Override
    public Map<String, Object> getFunctionDeclaration() {
        Map<String, Object> decl = new HashMap<>();
        decl.put("name", getName());
        decl.put("description", getDescription());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("type", "OBJECT");
        Map<String, Object> props = new HashMap<>();

        Map<String, Object> incomeProp = new HashMap<>();
        incomeProp.put("type", "NUMBER");
        incomeProp.put("description", "Tổng thu nhập hàng tháng (VNĐ), ví dụ: 15000000");
        props.put("income", incomeProp);

        Map<String, Object> actualExpensesProp = new HashMap<>();
        actualExpensesProp.put("type", "NUMBER");
        actualExpensesProp.put("description", "Tổng chi tiêu thực tế hàng tháng (VNĐ) nếu có");
        props.put("actualExpenses", actualExpensesProp);

        Map<String, Object> fixedExpensesProp = new HashMap<>();
        fixedExpensesProp.put("type", "NUMBER");
        fixedExpensesProp.put("description", "Tổng chi phí cố định hàng tháng (VNĐ) như tiền thuê nhà, tiền trọ, v.v.");
        props.put("fixedExpenses", fixedExpensesProp);

        Map<String, Object> actionProp = new HashMap<>();
        actionProp.put("type", "STRING");
        actionProp.put("description", "Hành động: 'RECOMMEND' (lập ngân sách) hoặc 'ANALYZE' (phân tích thu chi)");
        props.put("action", actionProp);

        parameters.put("properties", props);
        parameters.put("required", List.of("income"));
        decl.put("parameters", parameters);

        return decl;
    }

    @Override
    public ToolResultDto execute(User user, Map<String, Object> arguments) {
        String action = (String) (arguments != null ? arguments.getOrDefault("action", "RECOMMEND") : "RECOMMEND");
        if ("ANALYZE".equalsIgnoreCase(action)) {
            return analyzeBudget(user, arguments);
        }
        return recommendBudget(user, arguments);
    }

    public ToolResultDto recommendBudget(User user, Map<String, Object> arguments) {
        // Fix Lỗi 2: Do NOT hardcode default 12M income
        long income = parseLong(arguments != null ? arguments.get("income") : null, 0L);
        if (income <= 0) {
            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(false)
                    .message("Thiếu thông tin thu nhập")
                    .data(Map.of(
                            "missingIncome", true,
                            "promptUser", "Thu nhập hàng tháng của bạn khoảng bao nhiêu để SmartSpend tư vấn lập ngân sách phù hợp?"
                    ))
                    .build();
        }

        long actualExpenses = parseLong(arguments != null ? arguments.get("actualExpenses") : null, 0L);
        long fixedExpenses = parseLong(arguments != null ? arguments.get("fixedExpenses") : null, 0L);
        DecimalFormat df = new DecimalFormat("#,###");

        long essentialTarget = (long) (income * 0.50); // 50% Nhu cầu thiết yếu
        long personalTarget = (long) (income * 0.30);  // 30% Chi tiêu cá nhân
        long savingTarget = (long) (income * 0.20);    // 20% Tích lũy tiết kiệm

        Map<String, Object> resData = new HashMap<>();
        resData.put("income", income);
        if (fixedExpenses > 0) {
            resData.put("fixedExpenses", fixedExpenses);
        }
        if (actualExpenses > 0) {
            resData.put("actualExpenses", actualExpenses);
        }
        resData.put("essentialTarget", essentialTarget);
        resData.put("personalTarget", personalTarget);
        resData.put("savingTarget", savingTarget);

        String advice;
        if (fixedExpenses > 0) {
            long otherEssential = Math.max(0, essentialTarget - fixedExpenses);
            advice = String.format(
                    "Với thu nhập %s VNĐ/tháng và chi phí nhà/cố định %s VNĐ/tháng, SmartSpend gợi ý phân bổ ngân sách 50/30/20:\n" +
                    "- 🏠 Chi phí nhà/cố định: %s VNĐ\n" +
                    "- 🍚 Thiết yếu khác (còn lại trong 50%% thiết yếu): %s VNĐ\n" +
                    "- 🎮 Chi tiêu cá nhân (30%%): %s VNĐ\n" +
                    "- 💰 Tiết kiệm & Tích lũy (20%%): %s VNĐ",
                    df.format(income),
                    df.format(fixedExpenses),
                    df.format(fixedExpenses),
                    df.format(otherEssential),
                    df.format(personalTarget),
                    df.format(savingTarget)
            );
        } else if (actualExpenses > 0) {
            long monthlySaving = Math.max(0, income - actualExpenses);
            resData.put("monthlySaving", monthlySaving);
            advice = String.format(
                    "Với thu nhập %s VNĐ/tháng và chi tiêu khoảng %s VNĐ/tháng, bạn có thể tiết kiệm khoảng **%s VNĐ** mỗi tháng.",
                    df.format(income),
                    df.format(actualExpenses),
                    df.format(monthlySaving)
            );
        } else {
            advice = String.format(
                    "Với thu nhập %s VNĐ/tháng, SmartSpend gợi ý phân bổ ngân sách 50/30/20:\n- Thiết yếu (50%%): %s VNĐ\n- Cá nhân (30%%): %s VNĐ\n- Tiết kiệm (20%%): %s VNĐ",
                    df.format(income),
                    df.format(essentialTarget),
                    df.format(personalTarget),
                    df.format(savingTarget)
            );
        }
        resData.put("adviceText", advice);

        return ToolResultDto.builder()
                .toolName(getName())
                .success(true)
                .message("Tư vấn phân bổ ngân sách 50/30/20 thành công")
                .data(resData)
                .build();
    }

    public ToolResultDto analyzeBudget(User user, Map<String, Object> arguments) {
        long income = parseLong(arguments != null ? arguments.get("income") : null, 0L);
        if (income <= 0) {
            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(false)
                    .message("Thiếu thông tin thu nhập")
                    .data(Map.of(
                            "missingIncome", true,
                            "promptUser", "Thu nhập hàng tháng của bạn khoảng bao nhiêu để SmartSpend phân tích chi tiết?"
                    ))
                    .build();
        }
        return recommendBudget(user, arguments);
    }

    private long parseLong(Object obj, long defaultVal) {
        if (obj == null) return defaultVal;
        if (obj instanceof Number) return ((Number) obj).longValue();
        try {
            return Long.parseLong(obj.toString());
        } catch (Exception e) {
            return defaultVal;
        }
    }
}
