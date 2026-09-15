package com.project.app.notebook.repository;

import com.project.app.notebook.entity.NotebookBook;
import com.project.app.notebook.enums.NotebookBookType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotebookBookRepository extends JpaRepository<NotebookBook, Long> {

    Optional<NotebookBook> findByUserIdAndBookType(Long userId, NotebookBookType bookType);

    Optional<NotebookBook> findByIdAndUserId(Long id, Long userId);
}
