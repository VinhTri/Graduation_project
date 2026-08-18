package com.project.app.notebook;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

public final class NotebookReminderTimes {

    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private NotebookReminderTimes() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static LocalTime nowMinutes() {
        return LocalTime.now(ZONE).truncatedTo(ChronoUnit.MINUTES);
    }

    /**
     * true nếu giờ nhắc còn sau giờ hiện tại trong hôm nay (ví dụ 21:00 chọn 21:50).
     * false nếu giờ nhắc đã qua hoặc đúng phút hiện tại (ví dụ 21:00 chọn 20:58) → áp dụng ngày mai.
     */
    public static boolean isLaterToday(LocalTime reminderTime) {
        if (reminderTime == null) return false;
        return reminderTime.truncatedTo(ChronoUnit.MINUTES).isAfter(nowMinutes());
    }
}
