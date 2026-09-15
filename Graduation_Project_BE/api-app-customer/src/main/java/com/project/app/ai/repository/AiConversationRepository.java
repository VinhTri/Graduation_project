package com.project.app.ai.repository;
import com.project.app.ai.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AiConversationRepository extends JpaRepository<AiConversation,Long>{ Optional<AiConversation> findByPublicIdAndUserId(String publicId,Long userId); }
