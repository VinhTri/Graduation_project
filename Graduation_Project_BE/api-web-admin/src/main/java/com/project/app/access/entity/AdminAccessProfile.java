package com.project.app.access.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name="admin_access_profiles", uniqueConstraints=@UniqueConstraint(columnNames="user_id"))
@Getter @Setter @NoArgsConstructor
public class AdminAccessProfile {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_id",nullable=false) private Long userId;
    @Column(nullable=false,length=30) private String accessRole;
    @Column(nullable=false) private boolean active = true;
    @Column(name="updated_by",nullable=false,length=190) private String updatedBy;
    @UpdateTimestamp @Column(name="updated_at") private LocalDateTime updatedAt;
}
