package com.project.app.budget.service;

import com.project.app.budget.dto.request.CreateBudgetRequest;
import com.project.app.budget.dto.request.UpdateBudgetRequest;
import com.project.app.budget.dto.response.BudgetResponse;

import java.util.Collection;
import java.util.List;

public interface BudgetService {

    List<BudgetResponse> listBudgets(Long userId);

    BudgetResponse getBudget(Long userId, Long budgetId);

    BudgetResponse createBudget(Long userId, CreateBudgetRequest request);

    /** Chỉ cập nhật hạn mức và loại áp dụng. */
    BudgetResponse updateBudget(Long userId, Long budgetId, UpdateBudgetRequest request);

    void deleteBudget(Long userId, Long budgetId);

    /**
     * Khi soft-delete danh mục:
     * - ACTIVE / UPCOMING → invalidated + categoryDeleted
     * - COMPLETED → chỉ categoryDeleted
     */
    void markCategoryDeleted(Long userId, Long categoryId);

    void markCategoriesDeleted(Long userId, Collection<Long> categoryIds);
}
