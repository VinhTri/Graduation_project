package com.project.app.notebook.scheduler;

import com.project.app.common.service.EmailService;
import com.project.app.notification.enums.NotificationType;
import com.project.app.notification.service.NotificationService;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotebookReminderScheduler {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    /**
     * Chạy định kỳ vào 21:00 mỗi ngày để kiểm tra và gửi nhắc nhở cho người dùng
     * chưa ghi chép chi tiêu / thu nhập vào sổ tay trong ngày hôm đó.
     */
    @Scheduled(cron = "0 0 21 * * *")
    public void processDailyNotebookReminders() {
        log.info("Running NotebookReminderScheduler...");

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);

        List<User> activeUsers = userRepository.findAllByIsActiveTrue();

        for (User user : activeUsers) {
            try {
                boolean hasTransactionToday = transactionRepository.existsByUserIdAndCreatedAtBetween(
                        user.getId(),
                        startOfDay,
                        endOfDay
                );

                if (!hasTransactionToday) {
                    sendNotebookReminder(user);
                }
            } catch (Exception e) {
                log.error("Error checking notebook transactions for user ID: {}", user.getId(), e);
            }
        }
    }

    private void sendNotebookReminder(User user) {
        String title = "Nhắc nhở ghi chép sổ tay 📝";
        String message = "Hôm nay bạn chưa ghi chép các khoản thu/chi vào sổ tay. Hãy dành chút thời gian ghi lại để quản lý chi tiêu hiệu quả nhé!";

        // 1. Gửi thông báo trong ứng dụng
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

        // 2. Gửi email qua Gmail
        if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
            try {
                String subject = "[Finance App] Nhắc nhở ghi chép chi tiêu & thu nhập hôm nay";
                String emailContent = String.format(
                        "Xin chào %s,\n\n" +
                        "Hệ thống nhận thấy hôm nay bạn chưa ghi nhận khoản thu nhập hoặc chi tiêu nào vào sổ tay.\n\n" +
                        "Hãy mở ứng dụng và ghi chép lại ngay để theo dõi ngân sách tài chính cá nhân một cách đầy đủ và chính xác nhất nhé!\n\n" +
                        "Trân trọng,\nĐội ngũ Finance App",
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
