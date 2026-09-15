package com.project.app.user.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class AdminBankAccountResponse {
    private Long id;
    private String bankCode;
    private String bankName;
    private String accountNumber;
    private String accountName;
    private boolean isDefault;
    private LocalDateTime createdAt;
}
