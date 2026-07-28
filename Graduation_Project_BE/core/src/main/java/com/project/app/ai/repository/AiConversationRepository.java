package com.project.app.ai.repository;

import com.project.app.ai.entity.AiConversation;
import com.project.app.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {

    List<AiConversation> findByUserOrderByUpdatedAtDesc(User user);

    Page<AiConversation> findByUser(User user, Pageable pageable);

    Optional<AiConversation> findByIdAndUser(Long id, User user);
}
