package com.project.app.budget.dto.response;

import com.project.app.budget.dto.BudgetSourceSpend;
import com.project.app.budget.enums.BudgetApplyTo;
import com.project.app.budget.enums.BudgetStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {

    private Long id;
    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;
    private String categoryBgColor;
    private String categoryGroupName;
    private BudgetApplyTo applyTo;
    private BigDecimal limitAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    private BudgetStatus status;
    /** Danh mục đã bị soft-delete (snapshot ngân sách vẫn giữ). */
    private boolean categoryDeleted;

    /** Chi tiêu sổ tay trong kỳ (null nếu không áp dụng sổ tay). */
    private BudgetSourceSpend notebook;
    /** Chi tiêu ví trong kỳ (null nếu không áp dụng ví). */
    private BudgetSourceSpend wallet;
    /** Tổng chi của tất cả nguồn được áp dụng, dùng chung một hạn mức ngân sách. */
    private BudgetSourceSpend total;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
