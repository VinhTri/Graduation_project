package com.project.app.ai.tool;

import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.budget.dto.BudgetSourceSpend;
import com.project.app.budget.dto.response.BudgetResponse;
import com.project.app.budget.enums.BudgetStatus;
import com.project.app.budget.service.BudgetService;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GetBudgetStatusTool implements AiTool {

    private final BudgetService budgetService;

    @Override
    public String getName() {
        return "get_budget_status";
    }

    @Override
    public String getDescription() {
        return "Lấy trạng thái ngân sách đang hoạt động: hạn mức, đã chi, còn lại, có vượt hạn mức không. "
                + "Dùng khi user hỏi ngân sách, vượt ngân sách, còn bao nhiêu ngân sách.";
    }

    @Override
    public Map<String, Object> getFunctionDeclaration() {
        Map<String, Object> decl = new HashMap<>();
        decl.put("name", getName());
        decl.put("description", getDescription());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("type", "OBJECT");
        parameters.put("properties", Collections.emptyMap());
        decl.put("parameters", parameters);
        return decl;
    }

    @Override
    public ToolResultDto execute(User user, Map<String, Object> arguments) {
        if (user == null) {
            return failure("Người dùng chưa đăng nhập.");
        }

        try {
            List<BudgetResponse> all = budgetService.listBudgets(user.getId());
            List<BudgetResponse> active = all.stream()
                    .filter(b -> b.getStatus() == BudgetStatus.ACTIVE)
                    .toList();

            List<Map<String, Object>> budgetRows = new ArrayList<>();
            int overLimitCount = 0;

            for (BudgetResponse budget : active) {
                boolean over = isOverLimit(budget);
                if (over) {
                    overLimitCount++;
                }
                budgetRows.add(toRow(budget, over));
            }

            budgetRows.sort(Comparator
                    .comparing((Map<String, Object> row) -> !(Boolean) row.get("overLimit"))
                    .thenComparing(row -> -num(row.get("spent"))));

            Map<String, Object> data = new HashMap<>();
            data.put("totalBudgets", all.size());
            data.put("activeCount", active.size());
            data.put("overLimitCount", overLimitCount);
            data.put("budgets", budgetRows);

            String message = active.isEmpty()
                    ? "Không có ngân sách đang hoạt động."
                    : "Đã lấy " + active.size() + " ngân sách đang hoạt động.";

            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(true)
                    .message(message)
                    .data(data)
                    .build();
        } catch (Exception e) {
            log.error("get_budget_status failed for user {}: {}", user.getId(), e.getMessage(), e);
            return failure("Không lấy được trạng thái ngân sách. Thử lại sau.");
        }
    }

    private Map<String, Object> toRow(BudgetResponse budget, boolean over) {
        Map<String, Object> row = new HashMap<>();
        row.put("id", budget.getId());
        row.put("categoryName", budget.getCategoryName());
        row.put("categoryColor", budget.getCategoryColor());
        row.put("limitAmount", decimal(budget.getLimitAmount()));
        row.put("spent", decimal(totalSpent(budget)));
        row.put("remaining", decimal(totalRemaining(budget)));
        row.put("overLimit", over);
        row.put("startDate", budget.getStartDate() != null ? budget.getStartDate().toString() : null);
        row.put("endDate", budget.getEndDate() != null ? budget.getEndDate().toString() : null);
        row.put("applyTo", budget.getApplyTo() != null ? budget.getApplyTo().name() : null);
        return row;
    }

    private boolean isOverLimit(BudgetResponse budget) {
        if (budget.getNotebook() != null && budget.getNotebook().isOverLimit()) {
            return true;
        }
        return budget.getWallet() != null && budget.getWallet().isOverLimit();
    }

    private BigDecimal totalSpent(BudgetResponse budget) {
        BigDecimal spent = BigDecimal.ZERO;
        if (budget.getNotebook() != null) {
            spent = spent.add(nz(budget.getNotebook().getSpent()));
        }
        if (budget.getWallet() != null) {
            spent = spent.add(nz(budget.getWallet().getSpent()));
        }
        return spent;
    }

    private BigDecimal totalRemaining(BudgetResponse budget) {
        BudgetSourceSpend primary = budget.getNotebook() != null ? budget.getNotebook() : budget.getWallet();
        if (primary == null) {
            return budget.getLimitAmount();
        }
        return primary.getRemaining();
    }

    private BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private double decimal(BigDecimal value) {
        return value == null ? 0d : value.doubleValue();
    }

    private double num(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return 0d;
    }

    private ToolResultDto failure(String message) {
        return ToolResultDto.builder()
                .toolName(getName())
                .success(false)
                .message(message)
                .data(Collections.emptyMap())
                .build();
    }
}
