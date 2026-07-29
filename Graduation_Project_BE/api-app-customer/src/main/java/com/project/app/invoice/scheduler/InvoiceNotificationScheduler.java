package com.project.app.invoice.scheduler;

import com.project.app.invoice.entity.Invoice;
import com.project.app.invoice.repository.InvoiceRepository;
import com.project.app.notification.service.NotificationService;
import com.project.app.notification.enums.NotificationType;
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
public class InvoiceNotificationScheduler {

    private final InvoiceRepository invoiceRepository;
    private final NotificationService notificationService;

    // Run every minute
    @Scheduled(cron = "0 * * * * *")
    public void processInvoiceNotifications() {
        log.info("Running InvoiceNotificationScheduler...");
        List<Invoice> pendingInvoices = invoiceRepository.findByIsNotifiedFalseAndIsPaidFalseAndReminderTimeIsNotNull();

        LocalDateTime now = LocalDateTime.now();

        for (Invoice invoice : pendingInvoices) {
            String option = invoice.getReminderOption();
            if (option == null || option.isEmpty() || option.equals("Không nhắc nhở")) {
                continue;
            }

            LocalDate targetDate = calculateTargetDate(invoice.getDueDate(), option);
            if (targetDate == null) continue;

            LocalDateTime targetDateTime = LocalDateTime.of(targetDate, invoice.getReminderTime());

            // If current time is past or equal to target time
            if (!now.isBefore(targetDateTime)) {
                sendNotification(invoice);
            }
        }
    }

    private LocalDate calculateTargetDate(LocalDate dueDate, String option) {
        switch (option) {
            case "Đúng ngày":
                return dueDate;
            case "Trước 1 ngày":
                return dueDate.minusDays(1);
            case "Trước 2 ngày":
                return dueDate.minusDays(2);
            case "Trước 3 ngày":
                return dueDate.minusDays(3);
            default:
                return null; // Unknown option
        }
    }

    private void sendNotification(Invoice invoice) {
        try {
            String title = "Nhắc nhở thanh toán hóa đơn";
            String message = String.format("Hóa đơn '%s' với số tiền %s VNĐ sẽ đến hạn vào ngày %s. Vui lòng thanh toán đúng hạn.",
                    invoice.getInvoiceName(),
                    invoice.getAmount().toString(),
                    invoice.getDueDate().toString());

            notificationService.createNotification(invoice.getUser(), title, message, NotificationType.INVOICE_REMINDER, invoice.getId());

            invoice.setNotified(true);
            invoiceRepository.save(invoice);
            log.info("Sent notification for Invoice ID: {}", invoice.getId());
        } catch (Exception e) {
            log.error("Failed to send notification for Invoice ID: {}", invoice.getId(), e);
        }
    }
}
