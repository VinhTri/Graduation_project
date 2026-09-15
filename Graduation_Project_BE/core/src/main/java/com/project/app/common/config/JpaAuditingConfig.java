package com.project.app.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Bật JPA Auditing một lần trong core — tránh trùng bean jpaAuditingHandler
 * khi classpath có cả WebAdminApplication và AppCustomerApplication.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
