package com.project.app.ai.tool;

import com.project.app.ai.finance.ResolvedPeriod;
import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.report.dto.response.FinanceCenterResponse;
import com.project.app.report.service.ReportService;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GetFinanceCenterSummaryTool implements AiTool {

    private final ReportService reportService;

    @Override
    public String getName() {
        return "get_finance_center_summary";
    }

    @Override
    public String getDescription() {
        return "Lấy báo cáo Trung tâm tài chính: số dư ví/sổ tay, thu/chi/ròng theo kỳ (tuần/tháng/năm), "
                + "so sánh với kỳ trước. Dùng khi user hỏi tổng tài sản, thu chi kỳ, dòng tiền ví/sổ tay/quỹ, "
                + "hoặc so sánh hai kỳ. totalIncome/totalExpense = ví + sổ tay (không gồm quỹ). "
                + "totalAssets = số dư ví + sổ tay tại thời điểm hiện tại.";
    }

    @Override
    public Map<String, Object> getFunctionDeclaration() {
        Map<String, Object> decl = new HashMap<>();
        decl.put("name", getName());
        decl.put("description", getDescription());

        Map<String, Object> periodProp = new HashMap<>();
        periodProp.put("type", "STRING");
        periodProp.put("description", "WEEK, MONTH hoặc YEAR. Mặc định MONTH.");

        Map<String, Object> dateProp = new HashMap<>();
        dateProp.put("type", "STRING");
        dateProp.put("description", "Ngày neo kỳ hiện tại (YYYY-MM-DD). Mặc định hôm nay.");

        Map<String, Object> compareProp = new HashMap<>();
        compareProp.put("type", "STRING");
        compareProp.put("description", "Ngày neo kỳ so sánh (YYYY-MM-DD). Bỏ trống = kỳ trước.");

        Map<String, Object> properties = new HashMap<>();
        properties.put("period", periodProp);
        properties.put("date", dateProp);
        properties.put("compareDate", compareProp);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("type", "OBJECT");
        parameters.put("properties", properties);

        decl.put("parameters", parameters);
        return decl;
    }

    @Override
    public ToolResultDto execute(User user, Map<String, Object> arguments) {
        if (user == null) {
            return failure("Người dùng chưa đăng nhập.");
        }

        try {
            ResolvedPeriod resolved = resolveArguments(arguments);
            FinanceCenterResponse report = reportService.getFinanceCenter(
                    user,
                    resolved.period(),
                    resolved.anchorDate(),
                    resolved.compareDate());

            Map<String, Object> data = toPayload(report);
            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(true)
                    .message("Đã lấy báo cáo Trung tâm tài chính.")
                    .data(data)
                    .build();
        } catch (Exception e) {
            log.error("get_finance_center_summary failed for user {}: {}", user.getId(), e.getMessage(), e);
            return failure("Không lấy được báo cáo tài chính. Thử lại sau.");
        }
    }

    public ToolResultDto execute(User user, ResolvedPeriod period) {
        Map<String, Object> args = new HashMap<>();
        if (period != null) {
            args.put("period", period.period());
            args.put("date", period.anchorDate().toString());
            if (period.compareDate() != null) {
                args.put("compareDate", period.compareDate().toString());
            }
        }
        return execute(user, args);
    }

    private ResolvedPeriod resolveArguments(Map<String, Object> arguments) {
        String period = "MONTH";
        LocalDate date = LocalDate.now();
        LocalDate compareDate = null;

        if (arguments != null) {
            Object periodObj = arguments.get("period");
            if (periodObj != null && !periodObj.toString().isBlank()) {
                period = periodObj.toString().trim().toUpperCase();
            }
            Object dateObj = arguments.get("date");
            if (dateObj != null && !dateObj.toString().isBlank()) {
                date = LocalDate.parse(dateObj.toString().trim());
            }
            Object compareObj = arguments.get("compareDate");
            if (compareObj != null && !compareObj.toString().isBlank()) {
                compareDate = LocalDate.parse(compareObj.toString().trim());
            }
        }

        if (date.isAfter(LocalDate.now())) {
            date = LocalDate.now();
        }

        return new ResolvedPeriod(period, date, compareDate);
    }

    private Map<String, Object> toPayload(FinanceCenterResponse report) {
        Map<String, Object> data = new HashMap<>();
        data.put("period", report.getPeriod());
        data.put("currentLabel", report.getCurrentLabel());
        data.put("compareLabel", report.getCompareLabel());
        data.put("currentDate", report.getCurrentDate() != null ? report.getCurrentDate().toString() : null);
        data.put("compareDate", report.getCompareDate() != null ? report.getCompareDate().toString() : null);
        data.put("walletBalance", decimal(report.getWalletBalance()));
        data.put("cashBalance", decimal(report.getCashBalance()));
        data.put("totalAssets", decimal(report.getTotalAssets()));
        data.put("walletBalancePercent", report.getWalletBalancePercent());
        data.put("cashBalancePercent", report.getCashBalancePercent());
        data.put("current", snapshot(report.getCurrent()));
        data.put("compare", snapshot(report.getCompare()));
        data.put("delta", delta(report.getDelta()));
        return data;
    }

    private Map<String, Object> snapshot(FinanceCenterResponse.PeriodSnapshot snapshot) {
        if (snapshot == null) {
            return Collections.emptyMap();
        }
        Map<String, Object> map = new HashMap<>();
        map.put("wallet", flow(snapshot.getWallet()));
        map.put("cash", flow(snapshot.getCash()));
        map.put("fund", flow(snapshot.getFund()));
        map.put("totalIncome", decimal(snapshot.getTotalIncome()));
        map.put("totalExpense", decimal(snapshot.getTotalExpense()));
        map.put("net", decimal(snapshot.getNet()));
        return map;
    }

    private Map<String, Object> flow(FinanceCenterResponse.SourceFlow flow) {
        Map<String, Object> map = new HashMap<>();
        if (flow == null) {
            map.put("income", 0d);
            map.put("expense", 0d);
            map.put("net", 0d);
            return map;
        }
        map.put("income", decimal(flow.getIncome()));
        map.put("expense", decimal(flow.getExpense()));
        map.put("net", decimal(flow.getNet()));
        return map;
    }

    private Map<String, Object> delta(FinanceCenterResponse.PeriodDelta delta) {
        if (delta == null) {
            return Collections.emptyMap();
        }
        Map<String, Object> map = new HashMap<>();
        map.put("wallet", sourceDelta(delta.getWallet()));
        map.put("cash", sourceDelta(delta.getCash()));
        map.put("totalIncome", amountDelta(delta.getTotalIncome()));
        map.put("totalExpense", amountDelta(delta.getTotalExpense()));
        map.put("net", amountDelta(delta.getNet()));
        return map;
    }

    private Map<String, Object> sourceDelta(FinanceCenterResponse.SourceDelta delta) {
        if (delta == null) {
            return Collections.emptyMap();
        }
        Map<String, Object> map = new HashMap<>();
        map.put("income", amountDelta(delta.getIncome()));
        map.put("expense", amountDelta(delta.getExpense()));
        map.put("net", amountDelta(delta.getNet()));
        return map;
    }

    private Map<String, Object> amountDelta(FinanceCenterResponse.AmountDelta delta) {
        Map<String, Object> map = new HashMap<>();
        if (delta == null) {
            map.put("amount", 0d);
            map.put("percent", null);
            return map;
        }
        map.put("amount", decimal(delta.getAmount()));
        map.put("percent", delta.getPercent());
        return map;
    }

    private double decimal(BigDecimal value) {
        return value == null ? 0d : value.doubleValue();
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
