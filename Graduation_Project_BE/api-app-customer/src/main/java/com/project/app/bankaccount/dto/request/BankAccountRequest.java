package com.project.app.bankaccount.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountRequest {

    @NotBlank(message = "Mã ngân hàng không được để trống")
    @Size(max = 20, message = "Mã ngân hàng tối đa 20 ký tự")
    private String bankCode;

    @NotBlank(message = "Tên ngân hàng không được để trống")
    @Size(max = 100, message = "Tên ngân hàng tối đa 100 ký tự")
    private String bankName;

    @NotBlank(message = "Số tài khoản không được để trống")
    @Pattern(regexp = "^\\d{6,20}$", message = "Số tài khoản phải gồm 6 đến 20 chữ số")
    private String accountNumber;

    @Size(max = 150, message = "Tên chủ tài khoản tối đa 150 ký tự")
    private String accountName;
}
