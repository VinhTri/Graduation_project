package com.project.app.invoice.repository;

import com.project.app.invoice.entity.Invoice;
import com.project.app.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByUserOrderByDueDateAsc(User user);
    
    // Tìm các hóa đơn chưa thanh toán, chưa gửi thông báo, và có cài đặt thời gian nhắc nhở
    List<Invoice> findByIsNotifiedFalseAndIsPaidFalseAndReminderTimeIsNotNull();
    List<Invoice> findByIsPaidFalse();
}
