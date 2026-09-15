package com.project.app.support.service.admin;

import com.project.app.support.dto.request.SupportReplyRequest;
import com.project.app.support.dto.request.SupportStatusRequest;
import com.project.app.support.dto.response.SupportMessageResponse;
import com.project.app.support.dto.response.SupportTicketDetailResponse;
import com.project.app.support.dto.response.SupportTicketResponse;
import com.project.app.user.entity.User;

import java.util.List;

public interface AdminSupportService {
    List<SupportTicketResponse> getAllTickets();

    SupportTicketDetailResponse getTicketDetail(Long ticketId);

    SupportMessageResponse reply(Long ticketId, User admin, SupportReplyRequest request);

    SupportTicketResponse updateStatus(Long ticketId, SupportStatusRequest request);
}
