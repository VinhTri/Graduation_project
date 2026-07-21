package com.project.app.budget.service.impl;

import com.project.app.budget.dto.request.BudgetCreateRequest;
import com.project.app.budget.dto.request.BudgetUpdateRequest;
import com.project.app.budget.dto.response.BudgetResponse;
import com.project.app.budget.dto.response.BudgetSummaryResponse;
import com.project.app.budget.entity.Budget;
import com.project.app.budget.entity.BudgetPeriod;
import com.project.app.budget.enums.BudgetCycle;
import com.project.app.budget.repository.BudgetPeriodRepository;
import com.project.app.budget.repository.BudgetRepository;
import com.project.app.budget.service.BudgetService;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryItemRepository;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.user.entity.User;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.notification.service.NotificationService;
import com.project.app.notification.enums.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final BudgetPeriodRepository budgetPeriodRepository;
    private final CategoryItemRepository categoryItemRepository;
    private final WalletRepository walletRepository;
    private final NotificationService notificationService;

    public BudgetServiceImpl(BudgetRepository budgetRepository, 
                             BudgetPeriodRepository budgetPeriodRepository,
                             CategoryItemRepository categoryItemRepository, 
                             WalletRepository walletRepository,
                             NotificationService notificationService) {
        this.budgetRepository = budgetRepository;
        this.budgetPeriodRepository = budgetPeriodRepository;
        this.categoryItemRepository = categoryItemRepository;
        this.walletRepository = walletRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public BudgetResponse createBudget(User user, BudgetCreateRequest request) {
        // Validation: Limit must be at least 10,000
        if (request.amount() == null || request.amount().compareTo(new BigDecimal("10000")) < 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // Validation: Category exists and belongs to user
        CategoryItem category = categoryItemRepository.findById(request.categoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_ITEM_NOT_FOUND));

        if (category.getUser() == null || !category.getUser().getId().equals(user.getId()) || category.isDeleted()) {
            throw new AppException(ErrorCode.CATEGORY_INVALID_FOR_CASH); 
        }

        // Validation: Duplicate budget (same category and cycle)
        if (budgetRepository.existsByUserIdAndCategoryIdAndCycleAndIsDeletedFalse(user.getId(), category.getId(), request.cycle())) {
            throw new AppException(ErrorCode.BUDGET_ALREADY_EXISTS); // "A budget for this category and cycle already exists"
        }

        Wallet wallet = null;
        if (request.walletId() != null) {
            wallet = walletRepository.findByIdAndUserId(request.walletId(), user.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        }

        Budget budget = Budget.builder()
                .name(request.name())
                .user(user)
                .category(category)
                .wallet(wallet)
                .amount(request.amount())
                .cycle(request.cycle())
                .build();

        budget = budgetRepository.save(budget);

        // Auto-create current period
        BudgetPeriod period = getOrCreateCurrentPeriod(budget, LocalDate.now());

        return mapToResponse(budget, period);
    }

    @Override
    @Transactional
    public BudgetResponse updateBudget(User user, Long id, BudgetUpdateRequest request) {
        if (request.amount() == null || request.amount().compareTo(new BigDecimal("10000")) < 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Budget budget = budgetRepository.findByIdAndUserIdAndIsDeletedFalse(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));

        budget.setName(request.name());
        budget.setAmount(request.amount());
        budget = budgetRepository.save(budget);

        // Sync logic for current period
        BudgetPeriod currentPeriod = getOrCreateCurrentPeriod(budget, LocalDate.now());
        
        // Re-evaluate notifications based on new limit
        BigDecimal eightyPercent = budget.getAmount().multiply(new BigDecimal("0.8"));
        if (currentPeriod.getSpentAmount().compareTo(eightyPercent) < 0) {
            currentPeriod.setNotified80(false);
        }
        if (currentPeriod.getSpentAmount().compareTo(budget.getAmount()) < 0) {
            currentPeriod.setNotified100(false);
        }
        
        // Trigger notifications if limit was decreased and threshold is now met
        if (currentPeriod.getSpentAmount().compareTo(budget.getAmount()) >= 0 && !currentPeriod.isNotified100()) {
            currentPeriod.setNotified100(true);
            notificationService.createNotification(
                    user,
                    "Vượt hạn mức ngân sách!",
                    "Bạn đã vượt 100% hạn mức ngân sách cho danh mục " + budget.getCategory().getLabel() + " do thay đổi hạn mức.",
                    NotificationType.BUDGET_EXCEEDED,
                    budget.getId()
            );
        } else if (currentPeriod.getSpentAmount().compareTo(eightyPercent) >= 0 && !currentPeriod.isNotified80()) {
            currentPeriod.setNotified80(true);
            notificationService.createNotification(
                    user,
                    "Sắp vượt hạn mức ngân sách!",
                    "Bạn đã sử dụng " + (currentPeriod.getSpentAmount().multiply(new BigDecimal("100")).divide(budget.getAmount(), java.math.RoundingMode.HALF_UP)) + "% ngân sách cho danh mục " + budget.getCategory().getLabel() + " do thay đổi hạn mức.",
                    NotificationType.BUDGET_WARNING,
                    budget.getId()
            );
        }
        
        budgetPeriodRepository.save(currentPeriod);

        return mapToResponse(budget, currentPeriod);
    }

    @Override
    @Transactional
    public BudgetResponse cheatSpent(User user, Long id, BigDecimal spentAmount) {
        Budget budget = budgetRepository.findByIdAndUserIdAndIsDeletedFalse(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));

        BudgetPeriod period = getOrCreateCurrentPeriod(budget, LocalDate.now());
        period.setSpentAmount(spentAmount);
        
        BigDecimal eightyPercent = budget.getAmount().multiply(new BigDecimal("0.8"));

        if (period.getSpentAmount().compareTo(budget.getAmount()) >= 0) {
            period.setNotified100(true);
            period.setNotified80(true);
            notificationService.createNotification(
                    user,
                    "Vượt hạn mức ngân sách!",
                    "Bạn đã vượt 100% hạn mức ngân sách cho danh mục " + budget.getCategory().getLabel(),
                    NotificationType.BUDGET_EXCEEDED,
                    budget.getId()
            );
        } else if (period.getSpentAmount().compareTo(eightyPercent) >= 0) {
            period.setNotified80(true);
            notificationService.createNotification(
                    user,
                    "Sắp vượt hạn mức ngân sách!",
                    "Bạn đã sử dụng " + (period.getSpentAmount().multiply(new BigDecimal("100")).divide(budget.getAmount(), java.math.RoundingMode.HALF_UP)) + "% ngân sách cho danh mục " + budget.getCategory().getLabel(),
                    NotificationType.BUDGET_WARNING,
                    budget.getId()
            );
        } else {
            // Reset flags if test value is low
            period.setNotified80(false);
            period.setNotified100(false);
        }

        budgetPeriodRepository.save(period);
        return mapToResponse(budget, period);
    }

    @Override
    @Transactional
    public void deleteBudget(User user, Long id) {
        Budget budget = budgetRepository.findByIdAndUserIdAndIsDeletedFalse(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));
        budget.setDeleted(true);
        budgetRepository.save(budget);
    }

    @Override
    @Transactional
    public List<BudgetResponse> getUserBudgets(User user) {
        LocalDate today = LocalDate.now();
        List<Budget> budgets = budgetRepository.findByUserIdAndIsDeletedFalse(user.getId());
        
        return budgets.stream()
                .map(budget -> {
                    BudgetPeriod period = getOrCreateCurrentPeriod(budget, today);
                    return mapToResponse(budget, period);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BudgetResponse getBudgetById(User user, Long id) {
        Budget budget = budgetRepository.findByIdAndUserIdAndIsDeletedFalse(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));
        BudgetPeriod period = getOrCreateCurrentPeriod(budget, LocalDate.now());
        return mapToResponse(budget, period);
    }

    @Override
    @Transactional
    public BudgetSummaryResponse getBudgetSummary(User user) {
        LocalDate today = LocalDate.now();
        
        // Ensure all active budgets have a period for today
        List<Budget> budgets = budgetRepository.findByUserIdAndIsDeletedFalse(user.getId());
        for (Budget budget : budgets) {
            getOrCreateCurrentPeriod(budget, today);
        }

        // Now calculate summary based on active periods
        List<BudgetPeriod> activePeriods = budgetPeriodRepository.findActivePeriodsByUserAndDate(user.getId(), today);

        BigDecimal totalLimit = BigDecimal.ZERO;
        BigDecimal totalSpent = BigDecimal.ZERO;
        int warningCount = 0;

        for (BudgetPeriod period : activePeriods) {
            totalLimit = totalLimit.add(period.getBudget().getAmount());
            totalSpent = totalSpent.add(period.getSpentAmount());
            if (period.isNotified80() || period.isNotified100()) {
                warningCount++;
            }
        }

        BigDecimal remaining = totalLimit.subtract(totalSpent);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }

        return new BudgetSummaryResponse(totalLimit, totalSpent, remaining, warningCount);
    }

    /**
     * Lazy-loads or creates the BudgetPeriod for the given date.
     */
    private BudgetPeriod getOrCreateCurrentPeriod(Budget budget, LocalDate date) {
        return budgetPeriodRepository.findByBudgetIdAndDate(budget.getId(), date)
                .orElseGet(() -> {
                    LocalDate startDate = date;
                    LocalDate endDate = date;

                    switch (budget.getCycle()) {
                        case WEEKLY:
                            startDate = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                            endDate = date.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
                            break;
                        case MONTHLY:
                            startDate = date.withDayOfMonth(1);
                            endDate = date.with(TemporalAdjusters.lastDayOfMonth());
                            break;
                        case YEARLY:
                            startDate = date.withDayOfYear(1);
                            endDate = date.with(TemporalAdjusters.lastDayOfYear());
                            break;
                    }

                    BudgetPeriod newPeriod = BudgetPeriod.builder()
                            .budget(budget)
                            .startDate(startDate)
                            .endDate(endDate)
                            .spentAmount(BigDecimal.ZERO)
                            .isNotified80(false)
                            .isNotified100(false)
                            .build();

                    return budgetPeriodRepository.save(newPeriod);
                });
    }

    private BudgetResponse mapToResponse(Budget budget, BudgetPeriod period) {
        return new BudgetResponse(
                budget.getId(),
                budget.getName(),
                budget.getCategory().getId(),
                budget.getCategory().getLabel(),
                budget.getCategory().getIcon(),
                budget.getCategory().getColor(),
                budget.getCategory().getBgColor(),
                budget.getWallet() != null ? budget.getWallet().getId() : null,
                budget.getWallet() != null ? budget.getWallet().getName() : null,
                budget.getAmount(),
                period.getSpentAmount(),
                budget.getCycle(),
                period.getStartDate(),
                period.getEndDate(),
                period.isNotified80(),
                period.isNotified100()
        );
    }
}
