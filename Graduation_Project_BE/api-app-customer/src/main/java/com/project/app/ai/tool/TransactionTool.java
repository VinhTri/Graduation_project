package com.project.app.ai.tool;

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
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionTool implements AiTool {

    private final ReportService reportService;

    @Override
    public String getName() {
        return "get_monthly_spending";
    }

    @Override
    public String getDescription() {
        return "Lấy báo cáo chi tiêu thực tế của người dùng theo khoảng thời gian được yêu cầu (DAY, YESTERDAY, WEEK, MONTH, YEAR).";
    }

    @Override
    public Map<String, Object> getFunctionDeclaration() {
        Map<String, Object> decl = new HashMap<>();
        decl.put("name", getName());
        decl.put("description", getDescription());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("type", "OBJECT");
        Map<String, Object> props = new HashMap<>();

        Map<String, Object> periodProp = new HashMap<>();
        periodProp.put("type", "STRING");
        periodProp.put("description", "Khoảng thời gian cần báo cáo: 'DAY' (hôm nay), 'YESTERDAY' (hôm qua), 'WEEK' (tuần này), 'MONTH' (tháng này), 'YEAR' (năm nay). Mặc định là 'MONTH'");
        props.put("period", periodProp);

        parameters.put("properties", props);
        decl.put("parameters", parameters);

        return decl;
    }

    @Override
    public ToolResultDto execute(User user, Map<String, Object> arguments) {
        if (user == null) {
            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(false)
                    .message("Người dùng chưa đăng nhập")
                    .data(Map.of("totalSpent", 0, "categories", Collections.emptyList()))
                    .build();
        }

        try {
            String period = "MONTH";
            if (arguments != null) {
                if (arguments.containsKey("period")) {
                    period = (String) arguments.get("period");
                } else if (arguments.containsKey("timeRange")) {
                    period = (String) arguments.get("timeRange");
                }
            }

            List<ReportDistributionResponse> distribution = reportService.getDistributionReport(
                    user, TransactionType.EXPENSE, period, LocalDate.now()
            );

            BigDecimal totalSpent = BigDecimal.ZERO;
            List<Map<String, Object>> categoryList = new ArrayList<>();

            if (distribution != null) {
                distribution.sort((a, b) -> {
                    BigDecimal amtA = a.getTotalAmount() != null ? a.getTotalAmount() : BigDecimal.ZERO;
                    BigDecimal amtB = b.getTotalAmount() != null ? b.getTotalAmount() : BigDecimal.ZERO;
                    return amtB.compareTo(amtA);
                });

                for (ReportDistributionResponse item : distribution) {
                    if (item.getTotalAmount() != null && item.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
                        totalSpent = totalSpent.add(item.getTotalAmount());
                        Map<String, Object> cMap = new HashMap<>();
                        cMap.put("categoryName", item.getCategoryName());
                        cMap.put("amount", item.getTotalAmount());
                        cMap.put("percentage", item.getPercentage() != null ? item.getPercentage() : 0.0);
                        categoryList.add(cMap);
                    }
                }
            }

            Map<String, Object> resData = new HashMap<>();
            resData.put("totalSpent", totalSpent);
            resData.put("period", period);
            resData.put("categoryCount", categoryList.size());
            resData.put("categories", categoryList);
            if (!categoryList.isEmpty()) {
                resData.put("topCategory", categoryList.get(0).get("categoryName"));
                resData.put("topCategoryAmount", categoryList.get(0).get("amount"));
            }

            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(true)
                    .message("Lấy báo cáo chi tiêu thành công")
                    .data(resData)
                    .build();
        } catch (Exception e) {
            log.error("Error executing TransactionTool", e);
            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(false)
                    .message("Lỗi khi truy vấn báo cáo chi tiêu: " + e.getMessage())
                    .data(Collections.emptyMap())
                    .build();
        }
    }
}
