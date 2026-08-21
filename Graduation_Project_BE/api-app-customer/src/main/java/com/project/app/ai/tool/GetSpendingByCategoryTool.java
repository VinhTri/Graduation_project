package com.project.app.ai.tool;

import com.project.app.ai.finance.FinancePeriodParser;
import com.project.app.ai.finance.ResolvedPeriod;
import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.report.dto.response.ReportDistributionResponse;
import com.project.app.report.service.ReportService;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GetSpendingByCategoryTool implements AiTool {

    static final int DEFAULT_TOP = 6;

    private final ReportService reportService;
    private final FinancePeriodParser periodParser;

    @Override
    public String getName() {
        return "get_spending_by_category";
    }

    @Override
    public String getDescription() {
        return "Lấy phân bổ chi tiêu theo danh mục (top danh mục chi nhiều nhất) trong kỳ tuần/tháng/năm. "
                + "Có thể so sánh hai kỳ khi truyền compareDate hoặc compareMode=true. "
                + "Dữ liệu từ giao dịch ví đã phân loại danh mục.";
    }

    @Override
    public Map<String, Object> getFunctionDeclaration() {
        Map<String, Object> decl = new HashMap<>();
        decl.put("name", getName());
        decl.put("description", getDescription());

        Map<String, Object> properties = new HashMap<>();
        properties.put("period", prop("WEEK, MONTH hoặc YEAR. Mặc định MONTH."));
        properties.put("date", prop("Ngày neo kỳ hiện tại (YYYY-MM-DD). Mặc định hôm nay."));
        properties.put("compareDate", prop("Ngày neo kỳ so sánh (YYYY-MM-DD). Tùy chọn."));
        properties.put("compareMode", prop("true nếu cần so sánh với kỳ trước hoặc compareDate."));
        properties.put("limit", prop("Số danh mục top tối đa (mặc định 6)."));

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
            String period = stringArg(arguments, "period", "MONTH").toUpperCase();
            LocalDate anchor = parseDate(stringArg(arguments, "date", LocalDate.now().toString()));
            boolean compareMode = boolArg(arguments, "compareMode");
            LocalDate compareDate = parseOptionalDate(stringArg(arguments, "compareDate", null));
            int limit = intArg(arguments, "limit", DEFAULT_TOP);

            if (compareDate == null && compareMode) {
                compareDate = periodParser.defaultCompareDate(period, anchor);
            }

            return buildResult(user, period, anchor, compareDate, limit);
        } catch (Exception e) {
            log.error("get_spending_by_category failed for user {}: {}", user.getId(), e.getMessage(), e);
            return failure("Không lấy được phân bổ chi tiêu theo danh mục. Thử lại sau.");
        }
    }

    public ToolResultDto execute(User user, ResolvedPeriod period, boolean compareMode) {
        Map<String, Object> args = new HashMap<>();
        if (period != null) {
            args.put("period", period.period());
            args.put("date", period.anchorDate().toString());
            if (period.compareDate() != null) {
                args.put("compareDate", period.compareDate().toString());
            }
        }
        args.put("compareMode", compareMode);
        return execute(user, args);
    }

    private ToolResultDto buildResult(
            User user,
            String period,
            LocalDate anchor,
            LocalDate compareDate,
            int limit) {

        String filter = period.toLowerCase();
        List<ReportDistributionResponse> current = reportService.getDistributionReport(
                user, TransactionType.EXPENSE, filter, anchor);
        List<ReportDistributionResponse> compare = compareDate != null
                ? reportService.getDistributionReport(user, TransactionType.EXPENSE, filter, compareDate)
                : List.of();

        Map<String, Object> data = new HashMap<>();
        data.put("period", period);
        data.put("currentLabel", periodParser.periodLabel(period, anchor));
        data.put("currentDate", anchor.toString());
        data.put("compareMode", compareDate != null);
        data.put("currentTop", toRankList(current, limit));

        if (compareDate != null) {
            data.put("compareLabel", periodParser.periodLabel(period, compareDate));
            data.put("compareDate", compareDate.toString());
            data.put("compareTop", toRankList(compare, limit));
        }

        double currentTotal = sumAmount(current);
        data.put("currentTotal", currentTotal);

        String message = current.isEmpty()
                ? "Kỳ này chưa có chi tiêu theo danh mục trên ví."
                : "Đã lấy top " + Math.min(limit, current.size()) + " danh mục chi tiêu.";

        return ToolResultDto.builder()
                .toolName(getName())
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    private List<Map<String, Object>> toRankList(List<ReportDistributionResponse> rows, int limit) {
        List<Map<String, Object>> list = new ArrayList<>();
        int count = 0;
        for (ReportDistributionResponse row : rows) {
            if (count >= limit) {
                break;
            }
            Map<String, Object> item = new HashMap<>();
            item.put("categoryId", row.getCategoryId());
            item.put("categoryName", row.getCategoryName());
            item.put("icon", row.getIcon());
            item.put("color", row.getColor());
            item.put("totalAmount", decimal(row.getTotalAmount()));
            item.put("percentage", row.getPercentage());
            list.add(item);
            count++;
        }
        return list;
    }

    private double sumAmount(List<ReportDistributionResponse> rows) {
        return rows.stream()
                .map(ReportDistributionResponse::getTotalAmount)
                .map(this::decimal)
                .reduce(0d, Double::sum);
    }

    private Map<String, Object> prop(String description) {
        Map<String, Object> prop = new HashMap<>();
        prop.put("type", "STRING");
        prop.put("description", description);
        return prop;
    }

    private String stringArg(Map<String, Object> args, String key, String defaultValue) {
        if (args == null || args.get(key) == null) {
            return defaultValue;
        }
        String value = args.get(key).toString().trim();
        return value.isEmpty() ? defaultValue : value;
    }

    private boolean boolArg(Map<String, Object> args, String key) {
        if (args == null || args.get(key) == null) {
            return false;
        }
        Object value = args.get(key);
        if (value instanceof Boolean b) {
            return b;
        }
        return "true".equalsIgnoreCase(value.toString());
    }

    private int intArg(Map<String, Object> args, String key, int defaultValue) {
        if (args == null || args.get(key) == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(args.get(key).toString());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private LocalDate parseDate(String raw) {
        LocalDate date = LocalDate.parse(raw);
        return date.isAfter(LocalDate.now()) ? LocalDate.now() : date;
    }

    private LocalDate parseOptionalDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return parseDate(raw);
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
