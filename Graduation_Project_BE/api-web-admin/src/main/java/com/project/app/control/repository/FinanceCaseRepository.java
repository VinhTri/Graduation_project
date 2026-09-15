package com.project.app.control.repository;

import com.project.app.control.entity.FinanceCase;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FinanceCaseRepository extends JpaRepository<FinanceCase, Long> {
    List<FinanceCase> findTop500ByOrderByCreatedAtDesc();
}
