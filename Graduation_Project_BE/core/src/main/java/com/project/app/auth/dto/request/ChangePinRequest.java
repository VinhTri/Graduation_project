package com.project.app.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ChangePinRequest {

    @NotBlank(message = "Mã PIN hiện tại không được để trống")
    @Size(min = 6, max = 6, message = "Mã PIN hiện tại phải có đúng 6 chữ số")
    @Pattern(regexp = "\\d{6}", message = "Mã PIN hiện tại phải gồm 6 chữ số")
    private String currentPin;

    @NotBlank(message = "Mã PIN mới không được để trống")
    @Size(min = 6, max = 6, message = "Mã PIN mới phải có đúng 6 chữ số")
    @Pattern(regexp = "\\d{6}", message = "Mã PIN mới phải gồm 6 chữ số")
    private String newPinCode;

    public String getCurrentPin() {
        return currentPin;
    }

    public void setCurrentPin(String currentPin) {
        this.currentPin = currentPin;
    }

    public String getNewPinCode() {
        return newPinCode;
    }

    public void setNewPinCode(String newPinCode) {
        this.newPinCode = newPinCode;
    }
}
