package com.project.app.ai.repository;
import com.project.app.ai.entity.AiCategoryDraftEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AiCategoryDraftRepository extends JpaRepository<AiCategoryDraftEntity,Long>{ Optional<AiCategoryDraftEntity> findByUserId(Long userId); void deleteByUserId(Long userId); }
