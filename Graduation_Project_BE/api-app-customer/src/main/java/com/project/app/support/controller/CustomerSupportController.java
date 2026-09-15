package com.project.app.support.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.support.dto.request.CreateSupportTicketRequest;
import com.project.app.support.dto.request.SupportMessageRequest;
import com.project.app.support.dto.response.CustomerSupportMessageResponse;
import com.project.app.support.dto.response.CustomerSupportTicketResponse;
import com.project.app.support.service.CustomerSupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/support")
@RequiredArgsConstructor
public class CustomerSupportController {

    private final CustomerSupportService customerSupportService;

    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse<List<CustomerSupportTicketResponse>>> getMyTickets(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.<List<CustomerSupportTicketResponse>>builder()
                .success(true)
                .message("Success")
                .data(customerSupportService.getMyTickets(userDetails.getUser()))
                .build());
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<ApiResponse<CustomerSupportTicketResponse>> getMyTicketDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.<CustomerSupportTicketResponse>builder()
                .success(true)
                .message("Success")
                .data(customerSupportService.getMyTicketDetail(userDetails.getUser(), id))
                .build());
    }

    @PostMapping("/tickets")
    public ResponseEntity<ApiResponse<CustomerSupportTicketResponse>> createTicket(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateSupportTicketRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.<CustomerSupportTicketResponse>builder()
                .success(true)
                .message("Đã gửi yêu cầu hỗ trợ")
                .data(customerSupportService.createTicket(userDetails.getUser(), request))
                .build());
    }

    @PostMapping("/tickets/{id}/messages")
    public ResponseEntity<ApiResponse<CustomerSupportMessageResponse>> sendMessage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody SupportMessageRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.<CustomerSupportMessageResponse>builder()
                .success(true)
                .message("Đã gửi tin nhắn")
                .data(customerSupportService.sendMessage(userDetails.getUser(), id, request))
                .build());
    }
}
