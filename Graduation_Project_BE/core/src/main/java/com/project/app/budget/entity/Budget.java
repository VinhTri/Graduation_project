package com.project.app.budget.entity;

import com.project.app.budget.enums.BudgetApplyTo;
import com.project.app.common.entity.BaseEntity;
import com.project.app.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
        name = "budgets",
        indexes = {
                @Index(name = "idx_budgets_user_id", columnList = "user_id"),
                @Index(name = "idx_budgets_user_category", columnList = "user_id, category_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "category_name", nullable = false, length = 100)
    private String categoryName;

    @Column(name = "category_icon", length = 50)
    private String categoryIcon;

    @Column(name = "category_color", length = 20)
    private String categoryColor;

    @Column(name = "category_bg_color", length = 20)
    private String categoryBgColor;

    @Column(name = "category_group_name", length = 50)
    private String categoryGroupName;

    @Enumerated(EnumType.STRING)
    @Column(name = "apply_to", nullable = false, length = 20)
    private BudgetApplyTo applyTo;

    @Column(name = "limit_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal limitAmount;

    /** Ngày bắt đầu kỳ (inclusive). Không được sửa sau khi tạo. */
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /** Ngày kết thúc kỳ (inclusive). Không được sửa sau khi tạo. */
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * true khi danh mục đã soft-delete.
     * Ngân sách ACTIVE/UPCOMING sẽ bị invalidated; COMPLETED chỉ gắn cờ này.
     */
    @Column(name = "category_deleted", nullable = false)
    @Builder.Default
    private boolean categoryDeleted = false;

    /** true = hết hiệu lực (ngừng hoạt động) do xóa danh mục khi kỳ chưa kết thúc. */
    @Column(name = "invalidated", nullable = false)
    @Builder.Default
    private boolean invalidated = false;
}
