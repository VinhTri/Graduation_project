package com.project.app.notebook.scheduler;

import com.project.app.common.service.EmailService;
import com.project.app.notebook.NotebookReminderTimes;
import com.project.app.notification.enums.NotificationType;
import com.project.app.notification.service.NotificationService;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotebookReminderScheduler {

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    /**
     * Mỗi phút (giờ VN): user đã bật nhắc thì tới đúng giờ đã chọn sẽ nhận thông báo.
     */
    @Scheduled(cron = "0 * * * * *", zone = "Asia/Ho_Chi_Minh")
    public void processDailyNotebookReminders() {
        ZonedDateTime now = ZonedDateTime.now(NotebookReminderTimes.ZONE);
        LocalDate today = now.toLocalDate();
        LocalTime nowMinutes = now.toLocalTime().truncatedTo(ChronoUnit.MINUTES);

        List<User> users = userRepository
                .findAllByIsActiveTrueAndNotebookReminderEnabledTrueAndNotebookReminderTimeIsNotNull();

        for (User user : users) {
            try {
                LocalTime reminderTime = user.getNotebookReminderTime();
                if (reminderTime == null) continue;

                LocalTime target = reminderTime.truncatedTo(ChronoUnit.MINUTES);
                if (nowMinutes.isBefore(target)) continue;
                if (today.equals(user.getNotebookReminderLastSentOn())) continue;

                sendNotebookReminder(user);
                user.setNotebookReminderLastSentOn(today);
                userRepository.save(user);
            } catch (Exception e) {
                log.error("Error sending notebook reminder for user ID: {}", user.getId(), e);
            }
        }
    }

    private void sendNotebookReminder(User user) {
        String title = "Nhắc nhở ghi chép sổ tay 📝";
        String message = "Đã đến giờ ghi chép sổ tay. Hãy ghi lại các khoản thu/chi hôm nay nhé!";

        try {
            notificationService.createNotification(
                    user,
                    title,
                    message,
                    NotificationType.NOTEBOOK_REMINDER,
                    null
            );
            log.info("Created in-app notebook reminder notification for user ID: {}", user.getId());
        } catch (Exception e) {
            log.error("Failed to create in-app notification for user ID: {}", user.getId(), e);
        }

        if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
            try {
                String subject = "[SmartSpend] Nhắc nhở ghi chép chi tiêu hôm nay";
                String emailContent = String.format(
                        "Xin chào %s,\n\n" +
                        "Đã đến giờ bạn đã chọn để ghi chép sổ tay.\n\n" +
                        "Hãy mở ứng dụng và ghi lại các khoản thu/chi hôm nay để theo dõi chi tiêu đầy đủ nhé!\n\n" +
                        "Trân trọng,\nĐội ngũ SmartSpend",
                        user.getUsername() != null ? user.getUsername() : "bạn"
                );
                emailService.sendEmail(user.getEmail(), subject, emailContent);
                log.info("Sent notebook reminder email to: {}", user.getEmail());
            } catch (Exception e) {
                log.error("Failed to send reminder email to user ID: {}", user.getId(), e);
            }
        }
    }
}
