package com.project.app.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotebookReminderResponse {
    private boolean enabled;
    private String reminderTime;
    /** true = lần nhắc đầu trong hôm nay khi tới giờ đã chọn */
    private boolean appliesToday;
}
