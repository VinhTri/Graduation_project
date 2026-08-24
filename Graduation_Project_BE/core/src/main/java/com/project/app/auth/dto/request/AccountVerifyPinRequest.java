package com.project.app.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class AccountVerifyPinRequest {

    @NotBlank(message = "Mã PIN hiện tại không được để trống")
    @Pattern(regexp = "\\d{6}", message = "Mã PIN phải gồm đúng 6 chữ số")
    private String currentPinCode;

    public String getCurrentPinCode() {
        return currentPinCode;
    }

    public void setCurrentPinCode(String currentPinCode) {
        this.currentPinCode = currentPinCode;
    }
}
