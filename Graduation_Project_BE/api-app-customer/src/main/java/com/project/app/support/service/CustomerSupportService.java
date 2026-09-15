package com.project.app.support.service;

import com.project.app.support.dto.request.CreateSupportTicketRequest;
import com.project.app.support.dto.request.SupportMessageRequest;
import com.project.app.support.dto.response.CustomerSupportMessageResponse;
import com.project.app.support.dto.response.CustomerSupportTicketResponse;
import com.project.app.user.entity.User;

import java.util.List;

public interface CustomerSupportService {
    List<CustomerSupportTicketResponse> getMyTickets(User user);

    CustomerSupportTicketResponse getMyTicketDetail(User user, Long ticketId);

    CustomerSupportTicketResponse createTicket(User user, CreateSupportTicketRequest request);

    CustomerSupportMessageResponse sendMessage(User user, Long ticketId, SupportMessageRequest request);
}
