package com.project.app.ai.repository;
import com.project.app.ai.entity.AiConversationMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AiConversationMessageRepository extends JpaRepository<AiConversationMessage,Long>{ List<AiConversationMessage> findTop20ByConversationIdOrderByCreatedAtDesc(Long conversationId); }
