package com.project.app.invoice.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {

    @NotBlank(message = "Tên hóa đơn không được để trống")
    private String invoiceName;

    @NotNull(message = "Số tiền không được để trống")
    @Min(value = 0, message = "Số tiền phải lớn hơn hoặc bằng 0")
    private BigDecimal amount;

    @NotNull(message = "Ngày đến hạn không được để trống")
    @FutureOrPresent(message = "Ngày đến hạn phải từ hôm nay trở đi")
    private LocalDate dueDate;

    private String reminderOption;
    
    private LocalTime reminderTime;
    
    @JsonProperty("isPaid")
    @Builder.Default
    private boolean isPaid = false;
}
