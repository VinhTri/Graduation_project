package com.project.app.budget.enums;

/**
 * UPCOMING     — chưa đến ngày bắt đầu
 * ACTIVE       — đang trong kỳ
 * COMPLETED    — đã qua ngày kết thúc
 * INVALIDATED  — hết hiệu lực do xóa danh mục (kỳ ACTIVE/UPCOMING)
 */
public enum BudgetStatus {
    UPCOMING,
    ACTIVE,
    COMPLETED,
    INVALIDATED
}
