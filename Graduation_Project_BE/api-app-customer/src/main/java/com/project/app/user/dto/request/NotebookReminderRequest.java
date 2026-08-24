package com.project.app.user.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class NotebookReminderRequest {

    @NotNull(message = "Trạng thái nhắc nhở không được để trống")
    private Boolean enabled;

    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$", message = "Giờ nhắc phải có định dạng HH:mm")
    private String reminderTime;
}
