package com.project.app.splitbill.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSplitBillRequest {

    @NotBlank(message = "Tiêu đề yêu cầu chia tiền không được để trống")
    private String title;

    @NotNull(message = "Tổng số tiền không được để trống")
    @DecimalMin(value = "2000.00", message = "Tổng số tiền chia tối thiểu là 2.000đ")
    private BigDecimal totalAmount;

    private String note;

    @NotEmpty(message = "Danh sách bạn bè cùng chia tiền không được để trống")
    @Valid
    private List<SplitMemberItemRequest> members;
}
