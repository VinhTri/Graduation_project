package com.project.app.fund.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class FundMemberResponse {
    private Long id;
    private Long userId;
    private String name;
    private String avatarUrl;
    private String role;
    private String status;
    private BigDecimal contributedAmount;
}
