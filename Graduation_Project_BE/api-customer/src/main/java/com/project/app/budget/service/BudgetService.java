package com.project.app.budget.service;

import com.project.app.budget.dto.request.BudgetCreateRequest;
import com.project.app.budget.dto.request.BudgetUpdateRequest;
import com.project.app.budget.dto.response.BudgetResponse;
import com.project.app.budget.dto.response.BudgetSummaryResponse;
import com.project.app.user.entity.User;

import java.util.List;

public interface BudgetService {
    BudgetResponse createBudget(User user, BudgetCreateRequest request);
    
    BudgetResponse updateBudget(User user, Long id, BudgetUpdateRequest request);

    BudgetResponse cheatSpent(User user, Long id, java.math.BigDecimal spentAmount);
    
    void deleteBudget(User user, Long id);
    
    List<BudgetResponse> getUserBudgets(User user);
    
    BudgetResponse getBudgetById(User user, Long id);
    
    BudgetSummaryResponse getBudgetSummary(User user);
}
