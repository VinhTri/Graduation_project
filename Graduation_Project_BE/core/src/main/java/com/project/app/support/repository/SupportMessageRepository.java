package com.project.app.support.repository;

import com.project.app.support.entity.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {

    @Query("SELECT m FROM SupportMessage m JOIN FETCH m.sender WHERE m.ticket.id = :ticketId ORDER BY m.createdAt ASC")
    List<SupportMessage> findByTicketIdWithSenderOrderByCreatedAtAsc(@Param("ticketId") Long ticketId);
}
