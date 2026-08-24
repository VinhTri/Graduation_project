package com.project.app.control.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_finance_cases", indexes = {
        @Index(name = "idx_finance_case_status", columnList = "status"),
        @Index(name = "idx_finance_case_transaction", columnList = "transaction_code")
})
@Getter @Setter @NoArgsConstructor
public class FinanceCase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "transaction_code", length = 100)
    private String transactionCode;
    @Column(nullable = false, length = 20)
    private String severity;
    @Column(nullable = false, length = 30)
    private String status;
    @Column(nullable = false, length = 180)
    private String title;
    @Column(nullable = false, length = 1000)
    private String description;
    @Column(name = "resolution_note", length = 1000)
    private String resolutionNote;
    @Column(name = "created_by", nullable = false, length = 190)
    private String createdBy;
    @Column(name = "resolved_by", length = 190)
    private String resolvedBy;
    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
