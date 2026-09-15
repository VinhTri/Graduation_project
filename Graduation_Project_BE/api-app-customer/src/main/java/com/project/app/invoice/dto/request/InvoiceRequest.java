package com.project.app.invoice.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {

    @NotBlank(message = "Tên hóa đơn không được để trống")
    @Size(min = 2, max = 80, message = "Tên hóa đơn phải có từ 2 đến 80 ký tự")
    private String invoiceName;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0", inclusive = false, message = "Số tiền phải lớn hơn 0")
    @DecimalMax(value = "1000000000", message = "Số tiền không được vượt quá 1 tỷ đồng")
    private BigDecimal amount;

    @NotNull(message = "Ngày đến hạn không được để trống")
    @FutureOrPresent(message = "Ngày đến hạn phải từ hôm nay trở đi")
    private LocalDate dueDate;

    @NotBlank(message = "Vui lòng chọn thời điểm nhắc nhở")
    @Pattern(
            regexp = "Đúng ngày|Trước 1 ngày|Trước 2 ngày|Trước 3 ngày",
            message = "Thời điểm nhắc nhở không hợp lệ"
    )
    private String reminderOption;
    
    @NotNull(message = "Vui lòng chọn giờ nhắc nhở")
    private LocalTime reminderTime;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    @Min(value = 0, message = "Chỉ số cũ không được nhỏ hơn 0")
    @Max(value = 99999999, message = "Chỉ số cũ không được vượt quá 99.999.999")
    private Integer oldReading;
    
    @Min(value = 0, message = "Chỉ số chốt không được nhỏ hơn 0")
    @Max(value = 99999999, message = "Chỉ số chốt không được vượt quá 99.999.999")
    private Integer newReading;
    
    @Min(value = 0, message = "Đơn giá không được nhỏ hơn 0")
    @Max(value = 100000, message = "Đơn giá không được vượt quá 100.000")
    private Integer pricePerKwh;
    
    @JsonProperty("isPaid")
    @Builder.Default
    private boolean isPaid = false;
}
