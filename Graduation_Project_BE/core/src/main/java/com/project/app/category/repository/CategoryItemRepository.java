package com.project.app.category.repository;

import com.project.app.category.entity.CategoryItem;
import com.project.app.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryItemRepository extends JpaRepository<CategoryItem, Long> {

    Optional<CategoryItem> findFirstByLabelAndUserIsNullAndIsDeletedFalse(String label);

    Optional<CategoryItem> findFirstByLabelAndGroup_IdAndUserIsNullAndIsDeletedFalse(String label, Long groupId);

    Optional<CategoryItem> findFirstByLabelAndGroup_TitleAndUserIsNullAndIsDeletedFalse(String label, String groupTitle);

    Optional<CategoryItem> findByIdAndIsDeletedFalse(Long id);

    boolean existsByUserAndColorIgnoreCaseAndIsDeletedFalse(User user, String color);
}
