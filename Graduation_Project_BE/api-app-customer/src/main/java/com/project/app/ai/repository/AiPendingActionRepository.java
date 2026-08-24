package com.project.app.ai.repository;
import com.project.app.ai.entity.AiPendingAction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AiPendingActionRepository extends JpaRepository<AiPendingAction,Long>{ Optional<AiPendingAction> findByUserId(Long userId); void deleteByUserId(Long userId); }
