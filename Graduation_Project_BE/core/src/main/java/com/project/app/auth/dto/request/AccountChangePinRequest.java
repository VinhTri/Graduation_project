package com.project.app.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class AccountChangePinRequest {

    @NotBlank(message = "Mã PIN hiện tại không được để trống")
    @Pattern(regexp = "\\d{6}", message = "Mã PIN hiện tại phải gồm đúng 6 chữ số")
    private String currentPinCode;

    @NotBlank(message = "Mã PIN mới không được để trống")
    @Pattern(regexp = "\\d{6}", message = "Mã PIN mới phải gồm đúng 6 chữ số")
    private String newPinCode;

    @NotBlank(message = "Xác nhận mã PIN không được để trống")
    @Pattern(regexp = "\\d{6}", message = "Xác nhận mã PIN phải gồm đúng 6 chữ số")
    private String confirmPinCode;

    public String getCurrentPinCode() {
        return currentPinCode;
    }

    public void setCurrentPinCode(String currentPinCode) {
        this.currentPinCode = currentPinCode;
    }

    public String getNewPinCode() {
        return newPinCode;
    }

    public void setNewPinCode(String newPinCode) {
        this.newPinCode = newPinCode;
    }

    public String getConfirmPinCode() {
        return confirmPinCode;
    }

    public void setConfirmPinCode(String confirmPinCode) {
        this.confirmPinCode = confirmPinCode;
    }
}
