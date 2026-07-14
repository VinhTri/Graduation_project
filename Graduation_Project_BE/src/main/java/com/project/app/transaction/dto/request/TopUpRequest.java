package com.project.app.transaction.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class TopUpRequest {

    private Long walletId; // Tuỳ chọn, nếu null sẽ dùng ví mặc định

    @NotNull(message = "Số tiền nạp không được để trống")
    @DecimalMin(value = "10000", message = "Số tiền nạp tối thiểu là 10.000 VNĐ")
    private BigDecimal amount;

    private String note;

    private Long categoryId;

    // Getter và Setter

    public Long getWalletId() {
        return walletId;
    }

    public void setWalletId(Long walletId) {
        this.walletId = walletId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }
}
