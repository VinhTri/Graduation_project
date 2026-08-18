package com.project.app.budget.service.impl;

import com.project.app.budget.dto.BudgetSourceSpend;
import com.project.app.budget.dto.request.CreateBudgetRequest;
import com.project.app.budget.dto.request.UpdateBudgetRequest;
import com.project.app.budget.dto.response.BudgetResponse;
import com.project.app.budget.entity.Budget;
import com.project.app.budget.enums.BudgetApplyTo;
import com.project.app.budget.enums.BudgetStatus;
import com.project.app.budget.repository.BudgetRepository;
import com.project.app.budget.service.BudgetService;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.service.CategoryService;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.notebook.enums.NotebookTransactionType;
import com.project.app.notebook.repository.NotebookTransactionRepository;
import com.project.app.wallet.enums.WalletTransactionType;
import com.project.app.wallet.repository.WalletTransactionRepository;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryService categoryService;
    private final NotebookTransactionRepository notebookTransactionRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BudgetResponse> listBudgets(Long userId) {
        return budgetRepository.findAllByUserIdOrderByEndDateDescStartDateDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetResponse getBudget(Long userId, Long budgetId) {
        return toResponse(requireOwned(userId, budgetId));
    }

    @Override
    @Transactional
    public BudgetResponse createBudget(Long userId, CreateBudgetRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();
        if (endDate.isBefore(startDate)) {
            throw new AppException(ErrorCode.BUDGET_INVALID_DATE_RANGE);
        }
        if (startDate.isBefore(LocalDate.now())) {
            throw new AppException(ErrorCode.BUDGET_START_IN_PAST);
        }

        CategoryItem category = categoryService.requireUserOwnedItem(userId, request.getCategoryId());

        if (budgetRepository.existsOverlapping(userId, category.getId(), startDate, endDate)) {
            throw new AppException(ErrorCode.BUDGET_OVERLAPPING);
        }

        Budget budget = Budget.builder()
                .user(user)
                .categoryId(category.getId())
                .categoryName(category.getLabel())
                .categoryIcon(category.getIcon())
                .categoryColor(category.getColor())
                .categoryBgColor(category.getBgColor())
                .categoryGroupName(category.getGroup() != null ? category.getGroup().getTitle() : null)
                .applyTo(request.getApplyTo())
                .limitAmount(request.getLimitAmount())
                .startDate(startDate)
                .endDate(endDate)
                .categoryDeleted(false)
                .invalidated(false)
                .build();

        return toResponse(budgetRepository.save(budget));
    }

    @Override
    @Transactional
    public BudgetResponse updateBudget(Long userId, Long budgetId, UpdateBudgetRequest request) {
        Budget budget = requireOwned(userId, budgetId);
        if (budget.isInvalidated()) {
            throw new AppException(ErrorCode.BUDGET_INVALIDATED);
        }
        budget.setApplyTo(request.getApplyTo());
        budget.setLimitAmount(request.getLimitAmount());
        return toResponse(budgetRepository.save(budget));
    }

    @Override
    @Transactional
    public void deleteBudget(Long userId, Long budgetId) {
        Budget budget = requireOwned(userId, budgetId);
        budgetRepository.delete(budget);
    }

    @Override
    @Transactional
    public void markCategoryDeleted(Long userId, Long categoryId) {
        applyCategoryDeleted(budgetRepository.findAllByUserIdAndCategoryId(userId, categoryId));
    }

    @Override
    @Transactional
    public void markCategoriesDeleted(Long userId, Collection<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return;
        }
        applyCategoryDeleted(budgetRepository.findAllByUserIdAndCategoryIdIn(userId, categoryIds));
    }

    private void applyCategoryDeleted(List<Budget> budgets) {
        if (budgets.isEmpty()) {
            return;
        }
        LocalDate today = LocalDate.now();
        for (Budget budget : budgets) {
            budget.setCategoryDeleted(true);
            if (!today.isAfter(budget.getEndDate()) && !budget.isInvalidated()) {
                budget.setInvalidated(true);
            }
        }
        budgetRepository.saveAll(budgets);
    }

    private Budget requireOwned(Long userId, Long budgetId) {
        return budgetRepository.findByIdAndUserId(budgetId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));
    }

    private BudgetResponse toResponse(Budget budget) {
        LocalDate today = LocalDate.now();
        BudgetStatus status = resolveStatus(budget, today);

        LocalDateTime from = budget.getStartDate().atStartOfDay();
        LocalDateTime toExclusive = budget.getEndDate().plusDays(1).atStartOfDay();

        BudgetApplyTo applyTo = budget.getApplyTo();
        BudgetSourceSpend notebook = null;
        BudgetSourceSpend wallet = null;

        if (applyTo == BudgetApplyTo.NOTEBOOK || applyTo == BudgetApplyTo.BOTH) {
            BigDecimal spent = notebookTransactionRepository.sumAmountByUserAndTypeAndCategoryAndCreatedAtRange(
                    budget.getUser().getId(),
                    NotebookTransactionType.EXPENSE,
                    budget.getCategoryId(),
                    from,
                    toExclusive
            );
            notebook = buildSourceSpend(budget.getLimitAmount(), spent);
        }

        if (applyTo == BudgetApplyTo.WALLET || applyTo == BudgetApplyTo.BOTH) {
            BigDecimal spent = walletTransactionRepository.sumAmountByUserAndTypeAndCategoryAndCreatedAtRange(
                    budget.getUser().getId(),
                    WalletTransactionType.WITHDRAW,
                    budget.getCategoryId(),
                    from,
                    toExclusive
            );
            wallet = buildSourceSpend(budget.getLimitAmount(), spent);
        }

        return BudgetResponse.builder()
                .id(budget.getId())
                .categoryId(budget.getCategoryId())
                .categoryName(budget.getCategoryName())
                .categoryIcon(budget.getCategoryIcon())
                .categoryColor(budget.getCategoryColor())
                .categoryBgColor(budget.getCategoryBgColor())
                .categoryGroupName(resolveGroupName(budget))
                .applyTo(budget.getApplyTo())
                .limitAmount(budget.getLimitAmount())
                .startDate(budget.getStartDate())
                .endDate(budget.getEndDate())
                .status(status)
                .categoryDeleted(budget.isCategoryDeleted())
                .notebook(notebook)
                .wallet(wallet)
                .createdAt(budget.getCreatedAt())
                .updatedAt(budget.getUpdatedAt())
                .build();
    }

    private String resolveGroupName(Budget budget) {
        if (budget.getCategoryGroupName() != null && !budget.getCategoryGroupName().isBlank()) {
            return budget.getCategoryGroupName();
        }
        return categoryService.findItemIncludingDeleted(budget.getCategoryId())
                .map(item -> item.getGroup() != null ? item.getGroup().getTitle() : null)
                .orElse(null);
    }

    private BudgetStatus resolveStatus(Budget budget, LocalDate today) {
        if (budget.isInvalidated()) {
            return BudgetStatus.INVALIDATED;
        }
        if (today.isBefore(budget.getStartDate())) {
            return BudgetStatus.UPCOMING;
        }
        if (today.isAfter(budget.getEndDate())) {
            return BudgetStatus.COMPLETED;
        }
        return BudgetStatus.ACTIVE;
    }

    /**
     * Model B: mỗi nguồn đo độc lập với cùng hạn mức.
     * remaining = limit - spent (có thể âm).
     */
    private BudgetSourceSpend buildSourceSpend(BigDecimal limitAmount, BigDecimal spent) {
        BigDecimal safeSpent = spent == null ? BigDecimal.ZERO : spent;
        BigDecimal remaining = limitAmount.subtract(safeSpent);
        return BudgetSourceSpend.builder()
                .limitAmount(limitAmount)
                .spent(safeSpent)
                .remaining(remaining)
                .overLimit(remaining.signum() < 0)
                .build();
    }
}
