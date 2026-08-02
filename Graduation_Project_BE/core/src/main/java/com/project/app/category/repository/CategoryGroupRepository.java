package com.project.app.category.repository;

import com.project.app.category.entity.CategoryGroup;
import com.project.app.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryGroupRepository extends JpaRepository<CategoryGroup, Long> {
    
    List<CategoryGroup> findByUserAndIsDeletedFalseOrderByIdAsc(User user);

    List<CategoryGroup> findByUserIsNull();

    Optional<CategoryGroup> findFirstByTitleAndUserIsNullAndIsDeletedFalse(String title);

    long countByUserAndIsDeletedFalse(User user);

    boolean existsByUserAndColorIgnoreCaseAndIsDeletedFalse(User user, String color);
}
