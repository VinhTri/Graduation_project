package com.project.app.wallet.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class SetupAccountRequest {

    @NotBlank(message = "Số tài khoản không được để trống")
    @Pattern(regexp = "^[0-9]{8,15}$", message = "Số tài khoản chỉ được chứa chữ số và độ dài từ 8 đến 15 ký tự")
    private String accountNumber;

    public SetupAccountRequest() {
    }

    public SetupAccountRequest(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }
}
