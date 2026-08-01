package com.project.app.support.service.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.support.dto.request.CreateSupportTicketRequest;
import com.project.app.support.dto.request.SupportMessageRequest;
import com.project.app.support.dto.response.CustomerSupportMessageResponse;
import com.project.app.support.dto.response.CustomerSupportTicketResponse;
import com.project.app.support.entity.SupportMessage;
import com.project.app.support.entity.SupportTicket;
import com.project.app.support.enums.SupportSenderType;
import com.project.app.support.enums.SupportTicketStatus;
import com.project.app.support.repository.SupportMessageRepository;
import com.project.app.support.repository.SupportTicketRepository;
import com.project.app.support.service.CustomerSupportService;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerSupportServiceImpl implements CustomerSupportService {

    private final SupportTicketRepository ticketRepository;
    private final SupportMessageRepository messageRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CustomerSupportTicketResponse> getMyTickets(User user) {
        return ticketRepository.findByUserIdOrderByLastMessageAtDesc(user.getId()).stream()
                .map(t -> toTicketResponse(t, false))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerSupportTicketResponse getMyTicketDetail(User user, Long ticketId) {
        SupportTicket ticket = ticketRepository.findByIdAndUserId(ticketId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SUPPORT_TICKET_NOT_FOUND));
        return toTicketResponse(ticket, true);
    }

    @Override
    @Transactional
    public CustomerSupportTicketResponse createTicket(User user, CreateSupportTicketRequest request) {
        String subject = request.getSubject().trim();
        String content = request.getContent().trim();

        SupportTicket ticket = SupportTicket.builder()
                .user(user)
                .subject(subject)
                .status(SupportTicketStatus.OPEN)
                .lastMessage(truncate(content, 480))
                .lastMessageAt(LocalDateTime.now())
                .build();
        ticketRepository.save(ticket);

        SupportMessage message = SupportMessage.builder()
                .ticket(ticket)
                .sender(user)
                .senderType(SupportSenderType.USER)
                .content(content)
                .build();
        messageRepository.save(message);

        return toTicketResponse(ticket, true);
    }

    @Override
    @Transactional
    public CustomerSupportMessageResponse sendMessage(User user, Long ticketId, SupportMessageRequest request) {
        SupportTicket ticket = ticketRepository.findByIdAndUserId(ticketId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SUPPORT_TICKET_NOT_FOUND));

        if (ticket.getStatus() == SupportTicketStatus.CLOSED) {
            ticket.setStatus(SupportTicketStatus.OPEN);
        }

        String content = request.getContent().trim();
        SupportMessage message = SupportMessage.builder()
                .ticket(ticket)
                .sender(user)
                .senderType(SupportSenderType.USER)
                .content(content)
                .build();
        messageRepository.save(message);

        ticket.setLastMessage(truncate(content, 480));
        ticket.setLastMessageAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        return toMessageResponse(message);
    }

    private CustomerSupportTicketResponse toTicketResponse(SupportTicket ticket, boolean includeMessages) {
        List<CustomerSupportMessageResponse> messages = includeMessages
                ? messageRepository.findByTicketIdWithSenderOrderByCreatedAtAsc(ticket.getId()).stream()
                .map(this::toMessageResponse)
                .collect(Collectors.toList())
                : Collections.emptyList();

        return CustomerSupportTicketResponse.builder()
                .id(ticket.getId())
                .subject(ticket.getSubject())
                .status(ticket.getStatus() != null ? ticket.getStatus().name() : null)
                .lastMessage(ticket.getLastMessage())
                .lastMessageAt(ticket.getLastMessageAt())
                .createdAt(ticket.getCreatedAt())
                .messages(messages)
                .build();
    }

    private CustomerSupportMessageResponse toMessageResponse(SupportMessage message) {
        return CustomerSupportMessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .senderType(message.getSenderType() != null ? message.getSenderType().name() : null)
                .senderUsername(message.getSender() != null ? message.getSender().getUsername() : null)
                .createdAt(message.getCreatedAt())
                .build();
    }

    private String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }
}
