package com.project.app.audit.service;

import com.project.app.audit.entity.AdminAuditLog;
import com.project.app.audit.repository.AdminAuditLogRepository;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminAuditService {
    private final AdminAuditLogRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(User admin, String action, String targetType, Object targetId, String detail) {
        AdminAuditLog log = new AdminAuditLog();
        log.setAdminId(admin.getId());
        log.setAdminEmail(admin.getEmail());
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId == null ? null : String.valueOf(targetId));
        log.setDetail(trim(detail, 500));
        log.setSuccess(true);
        repository.save(log);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> recent() {
        return repository.findTop500ByOrderByCreatedAtDesc().stream().map(log -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", log.getId());
            row.put("adminId", log.getAdminId());
            row.put("adminEmail", log.getAdminEmail());
            row.put("action", log.getAction());
            row.put("targetType", log.getTargetType());
            row.put("targetId", log.getTargetId());
            row.put("detail", log.getDetail());
            row.put("success", log.isSuccess());
            row.put("createdAt", log.getCreatedAt());
            return row;
        }).toList();
    }

    private String trim(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }
}
