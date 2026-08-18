package com.project.app.fund.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class FundSummaryResponse {
    private Long id;
    private String name;
    private BigDecimal balance;
    private BigDecimal targetAmount;
    private BigDecimal minDepositAmount;
    private int coverColorSeed;
    @JsonProperty("isOwner")
    private boolean isOwner;
    private long memberCount;
}
