package com.project.app.transaction.dto.request;

public class UpdateTransactionRequest {

    private String note;
    private Long categoryId;

    public UpdateTransactionRequest() {
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
