package com.project.app.budget.repository;

import com.project.app.budget.entity.BudgetPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetPeriodRepository extends JpaRepository<BudgetPeriod, Long> {

    @Query("SELECT bp FROM BudgetPeriod bp WHERE bp.budget.id = :budgetId " +
           "AND :date BETWEEN bp.startDate AND bp.endDate")
    Optional<BudgetPeriod> findByBudgetIdAndDate(@Param("budgetId") Long budgetId, @Param("date") LocalDate date);

    @Query("SELECT bp FROM BudgetPeriod bp WHERE bp.budget.user.id = :userId " +
           "AND bp.budget.isDeleted = false " +
           "AND :date BETWEEN bp.startDate AND bp.endDate")
    List<BudgetPeriod> findActivePeriodsByUserAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT bp FROM BudgetPeriod bp WHERE bp.budget.user.id = :userId " +
           "AND bp.budget.category.id = :categoryId " +
           "AND bp.budget.isDeleted = false " +
           "AND :date BETWEEN bp.startDate AND bp.endDate " +
           "AND (bp.budget.wallet.id = :walletId OR bp.budget.wallet IS NULL)")
    List<BudgetPeriod> findActivePeriodsForTransaction(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("walletId") Long walletId,
            @Param("date") LocalDate date);
}
