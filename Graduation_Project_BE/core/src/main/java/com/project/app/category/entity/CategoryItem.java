package com.project.app.category.entity;

import com.project.app.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "category_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String label;

    @Column(nullable = false)
    private String icon;

    @Column(nullable = false)
    private String color;

    @Column(name = "bg_color", nullable = false)
    private String bgColor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private CategoryGroup group;

    // If user is null, it means this is a default item system-wide
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;
}
