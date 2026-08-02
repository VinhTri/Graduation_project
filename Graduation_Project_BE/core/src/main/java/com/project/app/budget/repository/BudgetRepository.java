package com.project.app.budget.repository;

import com.project.app.budget.entity.Budget;
import com.project.app.budget.enums.BudgetCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    
    List<Budget> findByUserIdAndIsDeletedFalse(Long userId);

    Optional<Budget> findByIdAndUserIdAndIsDeletedFalse(Long id, Long userId);
    
    boolean existsByUserIdAndCategoryIdAndCycleAndIsDeletedFalse(Long userId, Long categoryId, BudgetCycle cycle);
}
