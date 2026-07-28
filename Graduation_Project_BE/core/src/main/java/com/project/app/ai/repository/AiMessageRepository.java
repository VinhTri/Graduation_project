package com.project.app.ai.repository;

import com.project.app.ai.entity.AiConversation;
import com.project.app.ai.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    List<AiMessage> findByConversationOrderByCreatedAtAsc(AiConversation conversation);
}
