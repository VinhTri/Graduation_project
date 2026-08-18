package com.project.app.budget.dto.request;

import com.project.app.budget.enums.BudgetApplyTo;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/** Chỉ cho phép đổi hạn mức và loại áp dụng — không đổi ngày / danh mục. */
@Data
public class UpdateBudgetRequest {

    @NotNull(message = "Loại áp dụng không được để trống")
    private BudgetApplyTo applyTo;

    @NotNull(message = "Hạn mức không được để trống")
    @DecimalMin(value = "1000", message = "Hạn mức tối thiểu là 1.000đ")
    private BigDecimal limitAmount;
}
