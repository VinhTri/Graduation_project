package com.project.app.splitbill.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SplitMemberItemRequest {

    @NotNull(message = "ID người dùng không được để trống")
    private Long userId;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "2000.00", message = "Số tiền chia tối thiểu mỗi người là 2.000đ")
    private BigDecimal amount;
}
