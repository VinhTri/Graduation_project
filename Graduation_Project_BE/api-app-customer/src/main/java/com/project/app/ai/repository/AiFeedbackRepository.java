package com.project.app.ai.repository;
import com.project.app.ai.entity.AiFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AiFeedbackRepository extends JpaRepository<AiFeedback,Long>{Optional<AiFeedback> findByUserIdAndMessageId(Long userId,String messageId);}
