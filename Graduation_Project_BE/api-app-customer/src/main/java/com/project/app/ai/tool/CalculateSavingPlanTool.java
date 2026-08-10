package com.project.app.ai.tool;

import com.project.app.ai.calculator.GoalCalculator;
import com.project.app.ai.dto.internal.DurationInfo;
import com.project.app.ai.dto.internal.GoalCalculationResult;
import com.project.app.ai.parser.AmountParser;
import com.project.app.ai.service.DateResolverService;
import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.user.entity.User;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class CalculateSavingPlanTool implements AiTool {

    private final GoalCalculator goalCalculator;
    private final DateResolverService dateResolverService;
    private final WalletRepository walletRepository;
    private final AmountParser amountParser;

    @Override
    public String getName() {
        return "calculate_saving_plan";
    }

    @Override
    public String getDescription() {
        return "Tính toán kế hoạch tích lũy / tiết kiệm mua mục tiêu tài chính (ô tô, nhà, điện thoại, tiết kiệm...). Backend sẽ thực hiện phép tính toán học chính xác 100%.";
    }

    @Override
    public Map<String, Object> getFunctionDeclaration() {
        Map<String, Object> decl = new HashMap<>();
        decl.put("name", getName());
        decl.put("description", getDescription());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("type", "OBJECT");
        Map<String, Object> props = new HashMap<>();

        Map<String, Object> goalNameProp = new HashMap<>();
        goalNameProp.put("type", "STRING");
        goalNameProp.put("description", "Tên mục tiêu tài chính, ví dụ: 'ô tô', 'iPhone 16', 'laptop'");
        props.put("goalName", goalNameProp);

        Map<String, Object> targetAmountProp = new HashMap<>();
        targetAmountProp.put("type", "NUMBER");
        targetAmountProp.put("description", "Số tiền mục tiêu cần tích lũy (VNĐ), ví dụ: 300000000");
        props.put("targetAmount", targetAmountProp);

        Map<String, Object> durationTextProp = new HashMap<>();
        durationTextProp.put("type", "STRING");
        durationTextProp.put("description", "Mô tả thời hạn mục tiêu từ người dùng, ví dụ: '9 tháng', '2 năm', '45 ngày', 'Tết', 'cuối năm'");
        props.put("durationText", durationTextProp);

        Map<String, Object> durationMonthsProp = new HashMap<>();
        durationMonthsProp.put("type", "NUMBER");
        durationMonthsProp.put("description", "Số tháng mục tiêu (nếu xác định được), ví dụ: 9 hoặc 24");
        props.put("durationMonths", durationMonthsProp);

        Map<String, Object> declaredBalanceProp = new HashMap<>();
        declaredBalanceProp.put("type", "NUMBER");
        declaredBalanceProp.put("description", "Số tiền mặt/số dư người dùng khai báo trong câu hỏi (VNĐ) nếu có");
        props.put("declaredBalance", declaredBalanceProp);

        Map<String, Object> emergencyFundProp = new HashMap<>();
        emergencyFundProp.put("type", "NUMBER");
        emergencyFundProp.put("description", "Quỹ dự phòng muốn giữ lại (VNĐ) nếu người dùng đề cập");
        props.put("emergencyFund", emergencyFundProp);

        Map<String, Object> customMonthlySavingProp = new HashMap<>();
        customMonthlySavingProp.put("type", "NUMBER");
        customMonthlySavingProp.put("description", "Số tiền người dùng đề xuất chỉ có thể tiết kiệm được hàng tháng (VNĐ)");
        props.put("customMonthlySaving", customMonthlySavingProp);

        Map<String, Object> useCurrentBalanceProp = new HashMap<>();
        useCurrentBalanceProp.put("type", "BOOLEAN");
        useCurrentBalanceProp.put("description", "Có sử dụng số dư hiện tại trong ví để tính toán hay không. Mặc định là true.");
        props.put("useCurrentBalance", useCurrentBalanceProp);

        parameters.put("properties", props);
        parameters.put("required", List.of("goalName", "targetAmount"));
        decl.put("parameters", parameters);

        return decl;
    }

    @Override
    public ToolResultDto execute(User user, Map<String, Object> arguments) {
        try {
            String goalName = (String) arguments.getOrDefault("goalName", "mục tiêu tài chính");
            long targetAmount = parseLong(arguments.get("targetAmount"), 0L);
            String durationText = (String) arguments.getOrDefault("durationText", "");
            int durationMonths = parseInteger(arguments.get("durationMonths"), 0);
            long declaredBalance = parseLong(arguments.get("declaredBalance"), 0L);
            long emergencyFund = parseLong(arguments.get("emergencyFund"), 0L);
            long customMonthlySaving = parseLong(arguments.get("customMonthlySaving"), 0L);
            boolean useCurrentBalance = parseBoolean(arguments.get("useCurrentBalance"), true);

            DurationInfo durationInfo = null;
            if (durationText != null && !durationText.trim().isEmpty()) {
                durationInfo = dateResolverService.resolveDuration(durationText, LocalDate.now());
            }
            if ((durationInfo == null || (durationInfo.getMonths() == null || durationInfo.getMonths() <= 0) && (durationInfo.getDays() == null || durationInfo.getDays() <= 0)) && durationMonths > 0) {
                durationInfo = DurationInfo.builder()
                        .originalText(durationMonths + " tháng")
                        .months(durationMonths)
                        .days(durationMonths * 30)
                        .type(DurationInfo.DurationType.MONTHS)
                        .build();
            }

            boolean hasDuration = durationInfo != null && (
                    (durationInfo.getMonths() != null && durationInfo.getMonths() > 0) ||
                    (durationInfo.getDays() != null && durationInfo.getDays() > 0)
            );

            // Strict parameter missing check
            if (targetAmount <= 0 && !hasDuration) {
                return ToolResultDto.builder()
                        .toolName(getName())
                        .success(false)
                        .message("Thiếu số tiền mục tiêu và thời gian")
                        .data(Map.of(
                                "missingGoalAmount", true,
                                "missingDuration", true,
                                "promptUser", String.format("Bạn dự định mua %s khoảng bao nhiêu tiền và trong thời gian bao lâu?", goalName)
                        ))
                        .build();
            }

            if (targetAmount <= 0) {
                return ToolResultDto.builder()
                        .toolName(getName())
                        .success(false)
                        .message("Thiếu số tiền mục tiêu")
                        .data(Map.of(
                                "missingGoalAmount", true,
                                "promptUser", String.format("Bạn dự định mua %s khoảng bao nhiêu tiền?", goalName)
                        ))
                        .build();
            }

            if (!hasDuration) {
                return ToolResultDto.builder()
                        .toolName(getName())
                        .success(false)
                        .message("Thiếu thời hạn đạt mục tiêu")
                        .data(Map.of(
                                "missingDuration", true,
                                "promptUser", String.format("Bạn muốn hoàn thành mục tiêu %s trong thời gian bao lâu?", goalName)
                        ))
                        .build();
            }

            // Fetch actual balance if user is logged in
            BigDecimal userTotalBalance = BigDecimal.ZERO;
            if (user != null) {
                List<Wallet> wallets = walletRepository.findByUserId(user.getId());
                if (wallets != null) {
                    for (Wallet w : wallets) {
                        if (w.getBalance() != null) {
                            userTotalBalance = userTotalBalance.add(w.getBalance());
                        }
                    }
                }
            }

            GoalCalculationResult calcResult = goalCalculator.calculatePlan(
                    goalName,
                    targetAmount,
                    durationInfo,
                    userTotalBalance,
                    declaredBalance,
                    emergencyFund,
                    useCurrentBalance,
                    customMonthlySaving
            );

            Map<String, Object> resData = new HashMap<>();
            resData.put("goalName", goalName);
            resData.put("targetAmount", targetAmount);
            resData.put("durationText", durationInfo != null ? durationInfo.getOriginalText() : "");
            resData.put("durationMonths", durationInfo != null ? durationInfo.getMonths() : durationMonths);
            resData.put("declaredBalance", declaredBalance);
            resData.put("emergencyFund", emergencyFund);
            resData.put("customMonthlySaving", customMonthlySaving);
            resData.put("useCurrentBalance", useCurrentBalance);
            resData.put("requiredMonthlySaving", calcResult != null && calcResult.getUsingBalance() != null ? calcResult.getUsingBalance().getMonthlySaving() : 0L);
            resData.put("currentBalanceUsed", calcResult != null ? calcResult.getUsableBalance() : 0L);
            resData.put("planWithBalance", calcResult != null ? calcResult.getUsingBalance() : null);
            resData.put("planWithoutBalance", calcResult != null ? calcResult.getKeepingBalance() : null);
            if (calcResult != null && calcResult.getCustomSaving() != null) {
                resData.put("customSavingResult", calcResult.getCustomSaving());
            }

            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(true)
                    .message("Tính toán kế hoạch tiết kiệm thành công")
                    .data(resData)
                    .build();

        } catch (Exception e) {
            log.error("Error executing CalculateSavingPlanTool", e);
            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(false)
                    .message("Lỗi khi tính toán mục tiêu tài chính: " + e.getMessage())
                    .data(Collections.emptyMap())
                    .build();
        }
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

    private int parseInteger(Object obj, int defaultVal) {
        if (obj == null) return defaultVal;
        if (obj instanceof Number) return ((Number) obj).intValue();
        try {
            return Integer.parseInt(obj.toString());
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private boolean parseBoolean(Object obj, boolean defaultVal) {
        if (obj == null) return defaultVal;
        if (obj instanceof Boolean) return (Boolean) obj;
        return Boolean.parseBoolean(obj.toString());
    }
}
