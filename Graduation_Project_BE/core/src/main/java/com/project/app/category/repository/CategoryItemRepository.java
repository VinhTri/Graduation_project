package com.project.app.category.repository;

import com.project.app.category.entity.CategoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryItemRepository extends JpaRepository<CategoryItem, Long> {

    Optional<CategoryItem> findFirstByLabelAndUserIsNullAndIsDeletedFalse(String label);
}
