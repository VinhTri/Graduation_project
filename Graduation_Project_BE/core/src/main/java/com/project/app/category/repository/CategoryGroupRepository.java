package com.project.app.category.repository;

import com.project.app.category.entity.CategoryGroup;
import com.project.app.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryGroupRepository extends JpaRepository<CategoryGroup, Long> {
    
    List<CategoryGroup> findByUserAndIsDeletedFalseOrderByIdAsc(User user);

    List<CategoryGroup> findByUserIsNull();

    long countByUserAndIsDeletedFalse(User user);
}
