package com.project.app.fund.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class FundDetailResponse {
    private Long id;
    private String name;
    private BigDecimal balance;
    private BigDecimal targetAmount;
    private BigDecimal minDepositAmount;
    private int coverColorSeed;
    @JsonProperty("isOwner")
    private boolean isOwner;
    private long memberCount;
    private List<FundMemberResponse> members;
    private List<FundTransactionResponse> transactions;
}
