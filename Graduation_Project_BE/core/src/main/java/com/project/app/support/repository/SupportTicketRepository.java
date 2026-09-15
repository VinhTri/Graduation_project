package com.project.app.support.repository;

import com.project.app.support.entity.SupportTicket;
import com.project.app.support.enums.SupportTicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    @Query("SELECT t FROM SupportTicket t JOIN FETCH t.user ORDER BY COALESCE(t.lastMessageAt, t.createdAt) DESC")
    List<SupportTicket> findAllWithUserOrderByLastMessageDesc();

    List<SupportTicket> findByUserIdOrderByLastMessageAtDesc(Long userId);

    Optional<SupportTicket> findByIdAndUserId(Long id, Long userId);

    long countByStatus(SupportTicketStatus status);

    boolean existsBySubject(String subject);
}
