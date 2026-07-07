package com.project.app.invoice.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private Long id;
    private String invoiceName;
    private BigDecimal amount;
    private LocalDate dueDate;
    private String reminderOption;
    @JsonProperty("isPaid")
    private boolean isPaid;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
