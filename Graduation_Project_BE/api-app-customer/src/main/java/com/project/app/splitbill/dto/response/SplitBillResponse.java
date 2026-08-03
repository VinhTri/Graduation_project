package com.project.app.splitbill.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SplitBillResponse {
    private Long id;
    private Long creatorId;
    private String creatorUsername;
    private String creatorEmail;
    private String creatorAccountNumber;
    private String creatorAvatarUrl;
    private String title;
    private BigDecimal totalAmount;
    private String note;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<SplitBillMemberResponse> members;
    private boolean isCreator;
    private String myStatus;
    private BigDecimal myAmount;
    private BigDecimal totalPaidAmount;
    private BigDecimal totalPendingAmount;
    private int paidMembersCount;
    private int totalMembersCount;
}
