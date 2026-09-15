package com.project.app.notebook.service.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.notebook.dto.NotebookBookResponse;
import com.project.app.notebook.entity.NotebookBook;
import com.project.app.notebook.enums.NotebookBookType;
import com.project.app.notebook.repository.NotebookBookRepository;
import com.project.app.notebook.service.NotebookBookService;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class NotebookBookServiceImpl implements NotebookBookService {

    private final NotebookBookRepository notebookBookRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public NotebookBookResponse getOrCreateCashBook(Long userId) {
        NotebookBook book = notebookBookRepository.findByUserIdAndBookType(userId, NotebookBookType.CASH)
                .orElseGet(() -> createCashBook(userId));
        return NotebookBookResponse.from(book);
    }

    public NotebookBook findOwnedBook(Long userId, Long bookId) {
        return notebookBookRepository.findByIdAndUserId(bookId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_BOOK_NOT_FOUND));
    }

    public NotebookBook getOrCreateCashBookEntity(Long userId) {
        return notebookBookRepository.findByUserIdAndBookType(userId, NotebookBookType.CASH)
                .orElseGet(() -> createCashBook(userId));
    }

    private NotebookBook createCashBook(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        NotebookBook book = NotebookBook.builder()
                .user(user)
                .name(NotebookBook.CASH_BOOK_NAME)
                .balance(BigDecimal.ZERO)
                .bookType(NotebookBookType.CASH)
                .build();

        return notebookBookRepository.save(book);
    }
}
