package com.project.app.splitbill.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaySplitBillRequest {

    @NotBlank(message = "Mã PIN không được để trống")
    private String pinCode;

    private String note;
}
