package com.project.app.budget.scheduler;

import com.project.app.budget.dto.response.BudgetResponse;
import com.project.app.budget.entity.Budget;
import com.project.app.budget.repository.BudgetRepository;
import com.project.app.budget.service.BudgetService;
import com.project.app.notification.enums.NotificationType;
import com.project.app.notification.repository.NotificationRepository;
import com.project.app.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BudgetNotificationScheduler {

    private static final BigDecimal WARNING_RATIO = new BigDecimal("0.80");

    private final BudgetRepository budgetRepository;
    private final BudgetService budgetService;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void checkBudgetThresholds() {
        LocalDate today = LocalDate.now();
        List<Budget> budgets = budgetRepository
                .findAllByInvalidatedFalseAndStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today);

        for (Budget budget : budgets) {
            try {
                BudgetResponse detail = budgetService.getBudget(budget.getUser().getId(), budget.getId());
                if (detail.getTotal() == null || detail.getTotal().getSpent() == null) continue;

                BigDecimal spent = detail.getTotal().getSpent();
                BigDecimal limit = detail.getLimitAmount();
                if (limit == null || limit.compareTo(BigDecimal.ZERO) <= 0) continue;

                NotificationType type;
                String title;
                String message;
                if (spent.compareTo(limit) > 0) {
                    type = NotificationType.BUDGET_EXCEEDED;
                    title = "Ngân sách đã vượt hạn mức";
                    message = "Danh mục \"" + detail.getCategoryName() + "\" đã chi "
                            + spent.toPlainString() + "đ, vượt mức " + limit.toPlainString() + "đ.";
                } else if (spent.compareTo(limit.multiply(WARNING_RATIO)) >= 0) {
                    type = NotificationType.BUDGET_WARNING;
                    title = "Ngân sách sắp chạm hạn mức";
                    message = "Danh mục \"" + detail.getCategoryName() + "\" đã sử dụng ít nhất 80% ngân sách.";
                } else {
                    continue;
                }

                if (!notificationRepository.existsByUserIdAndTypeAndRelatedId(
                        budget.getUser().getId(), type, budget.getId())) {
                    notificationService.createNotification(
                            budget.getUser(), title, message, type, budget.getId());
                }
            } catch (Exception exception) {
                log.warn("Không thể kiểm tra cảnh báo ngân sách {}: {}", budget.getId(), exception.getMessage());
            }
        }
    }
}
