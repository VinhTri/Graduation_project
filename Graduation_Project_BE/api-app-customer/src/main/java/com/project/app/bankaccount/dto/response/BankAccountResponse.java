package com.project.app.bankaccount.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountResponse {
    private Long id;
    private String bankCode;
    private String bankName;
    private String accountNumber;
    private String accountName;
    private boolean isDefault;
    private LocalDateTime createdAt;
}
