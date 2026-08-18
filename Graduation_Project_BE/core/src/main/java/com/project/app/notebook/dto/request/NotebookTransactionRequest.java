package com.project.app.notebook.dto.request;

import com.project.app.notebook.enums.NotebookTransactionType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class NotebookTransactionRequest {

    @NotNull(message = "Số tiền là bắt buộc")
    @DecimalMin(value = "1", message = "Số tiền phải lớn hơn 0")
    @DecimalMax(value = "100000000000", message = "Số tiền tối đa mỗi lần nhập/rút là 100 tỷ")
    private BigDecimal amount;

    @NotNull(message = "Loại giao dịch là bắt buộc")
    private NotebookTransactionType type;

    @NotNull(message = "Danh mục là bắt buộc")
    private Long categoryId;

    private String note;

    /** Bỏ trống = sổ tiền mặt mặc định. */
    private Long bookId;

    /** Ngày ghi chép (tùy chọn). Bỏ trống = thời điểm hiện tại. */
    private LocalDate entryDate;
}
