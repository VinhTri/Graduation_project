package com.project.app.notification.repository;

import com.project.app.notification.entity.Notification;
import com.project.app.user.entity.User;
import com.project.app.notification.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndIsReadFalse(Long userId);
    boolean existsByUserIdAndTypeAndRelatedId(Long userId, NotificationType type, Long relatedId);

    @Modifying
    @Transactional
    void deleteByUserIdAndTypeAndRelatedId(Long userId, NotificationType type, Long relatedId);

    @Modifying
    @Transactional
    void deleteByTypeAndRelatedId(NotificationType type, Long relatedId);
}
