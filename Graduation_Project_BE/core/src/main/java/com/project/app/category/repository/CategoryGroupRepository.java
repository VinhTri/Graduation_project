package com.project.app.category.repository;

import com.project.app.category.entity.CategoryGroup;
import com.project.app.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryGroupRepository extends JpaRepository<CategoryGroup, Long> {
    
    // Find all groups that belong to the user, OR are default system groups (user is null)
    @Query("SELECT g FROM CategoryGroup g WHERE g.user = :user OR g.user IS NULL ORDER BY g.id ASC")
    List<CategoryGroup> findByUserOrDefault(User user);
    
    // To check if default groups are already seeded
    boolean existsByUserIsNull();
}
