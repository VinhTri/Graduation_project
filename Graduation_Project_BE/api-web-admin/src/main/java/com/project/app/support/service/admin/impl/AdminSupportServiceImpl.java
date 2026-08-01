package com.project.app.support.service.admin.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.support.dto.request.SupportReplyRequest;
import com.project.app.support.dto.request.SupportStatusRequest;
import com.project.app.support.dto.response.SupportMessageResponse;
import com.project.app.support.dto.response.SupportTicketDetailResponse;
import com.project.app.support.dto.response.SupportTicketResponse;
import com.project.app.support.entity.SupportMessage;
import com.project.app.support.entity.SupportTicket;
import com.project.app.support.enums.SupportSenderType;
import com.project.app.support.enums.SupportTicketStatus;
import com.project.app.support.repository.SupportMessageRepository;
import com.project.app.support.repository.SupportTicketRepository;
import com.project.app.support.service.admin.AdminSupportService;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminSupportServiceImpl implements AdminSupportService {

    private final SupportTicketRepository ticketRepository;
    private final SupportMessageRepository messageRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SupportTicketResponse> getAllTickets() {
        return ticketRepository.findAllWithUserOrderByLastMessageDesc().stream()
                .map(this::toTicketResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SupportTicketDetailResponse getTicketDetail(Long ticketId) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new AppException(ErrorCode.SUPPORT_TICKET_NOT_FOUND));
        // ensure user loaded
        ticket.getUser().getUsername();

        List<SupportMessageResponse> messages = messageRepository
                .findByTicketIdWithSenderOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::toMessageResponse)
                .collect(Collectors.toList());

        return SupportTicketDetailResponse.builder()
                .ticket(toTicketResponse(ticket))
                .messages(messages)
                .build();
    }

    @Override
    @Transactional
    public SupportMessageResponse reply(Long ticketId, User admin, SupportReplyRequest request) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new AppException(ErrorCode.SUPPORT_TICKET_NOT_FOUND));

        String content = request.getContent().trim();
        SupportMessage message = SupportMessage.builder()
                .ticket(ticket)
                .sender(admin)
                .senderType(SupportSenderType.ADMIN)
                .content(content)
                .build();
        messageRepository.save(message);

        ticket.setLastMessage(truncate(content, 480));
        ticket.setLastMessageAt(LocalDateTime.now());
        if (ticket.getStatus() == SupportTicketStatus.OPEN) {
            ticket.setStatus(SupportTicketStatus.IN_PROGRESS);
        }
        ticketRepository.save(ticket);

        return toMessageResponse(message);
    }

    @Override
    @Transactional
    public SupportTicketResponse updateStatus(Long ticketId, SupportStatusRequest request) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new AppException(ErrorCode.SUPPORT_TICKET_NOT_FOUND));
        ticket.getUser().getUsername();

        try {
            ticket.setStatus(SupportTicketStatus.valueOf(request.getStatus().trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        ticketRepository.save(ticket);
        return toTicketResponse(ticket);
    }

    private SupportTicketResponse toTicketResponse(SupportTicket ticket) {
        User user = ticket.getUser();
        return SupportTicketResponse.builder()
                .id(ticket.getId())
                .subject(ticket.getSubject())
                .status(ticket.getStatus() != null ? ticket.getStatus().name() : null)
                .lastMessage(ticket.getLastMessage())
                .lastMessageAt(ticket.getLastMessageAt())
                .createdAt(ticket.getCreatedAt())
                .userId(user != null ? user.getId() : null)
                .username(user != null ? user.getUsername() : null)
                .email(user != null ? user.getEmail() : null)
                .build();
    }

    private SupportMessageResponse toMessageResponse(SupportMessage message) {
        User sender = message.getSender();
        return SupportMessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .senderType(message.getSenderType() != null ? message.getSenderType().name() : null)
                .senderId(sender != null ? sender.getId() : null)
                .senderUsername(sender != null ? sender.getUsername() : null)
                .createdAt(message.getCreatedAt())
                .build();
    }

    private String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }
}
