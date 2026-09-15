package com.project.app.fund.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InviteFundRequest {

    @NotNull(message = "userId là bắt buộc")
    private Long userId;
}
