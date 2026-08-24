package com.project.app.budget.repository;

import com.project.app.budget.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findAllByUserIdOrderByEndDateDescStartDateDesc(Long userId);

    Optional<Budget> findByIdAndUserId(Long id, Long userId);

    List<Budget> findAllByUserIdAndCategoryId(Long userId, Long categoryId);

    List<Budget> findAllByUserIdAndCategoryIdIn(Long userId, Collection<Long> categoryIds);

    List<Budget> findAllByInvalidatedFalseAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            LocalDate startDate,
            LocalDate endDate);

    @Query("""
            SELECT COUNT(b) > 0 FROM Budget b
            WHERE b.user.id = :userId
              AND b.categoryId = :categoryId
              AND b.invalidated = false
              AND b.startDate <= :endDate
              AND b.endDate >= :startDate
            """)
    boolean existsOverlapping(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
