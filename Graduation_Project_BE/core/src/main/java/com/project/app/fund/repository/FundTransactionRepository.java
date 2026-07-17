package com.project.app.fund.repository;

import com.project.app.fund.entity.FundTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface FundTransactionRepository extends JpaRepository<FundTransaction, Long> {

    List<FundTransaction> findByFundIdOrderByCreatedAtDesc(Long fundId);

    Optional<FundTransaction> findByIdAndFundId(Long id, Long fundId);

    @Modifying
    @Transactional
    void deleteByFundId(Long fundId);
}
