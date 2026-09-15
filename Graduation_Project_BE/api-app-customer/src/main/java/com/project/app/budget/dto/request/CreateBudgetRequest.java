package com.project.app.budget.dto.request;

import com.project.app.budget.enums.BudgetApplyTo;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateBudgetRequest {

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    @NotNull(message = "Loại áp dụng không được để trống")
    private BudgetApplyTo applyTo;

    @NotNull(message = "Hạn mức không được để trống")
    @DecimalMin(value = "1000", message = "Hạn mức tối thiểu là 1.000đ")
    private BigDecimal limitAmount;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;
}
