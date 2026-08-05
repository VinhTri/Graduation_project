package com.project.app.fund.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FundInvitationResponse {
    private Long id;
    private Long fundId;
    private String fundName;
    private BigDecimal balance;
    private BigDecimal targetAmount;
    private Integer coverColorSeed;
    private Long ownerId;
    private String ownerName;
    private String ownerAvatar;
    private Long memberCount;
    private LocalDateTime invitedAt;
}
