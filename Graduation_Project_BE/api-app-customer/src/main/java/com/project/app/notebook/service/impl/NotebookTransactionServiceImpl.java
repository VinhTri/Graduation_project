package com.project.app.notebook.service.impl;

import com.project.app.category.entity.CategoryItem;
import com.project.app.category.service.CategoryService;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.notebook.dto.NotebookTransactionResponse;
import com.project.app.notebook.dto.request.NotebookTransactionRequest;
import com.project.app.notebook.entity.NotebookBook;
import com.project.app.notebook.entity.NotebookTransaction;
import com.project.app.notebook.enums.NotebookTransactionType;
import com.project.app.notebook.repository.NotebookBookRepository;
import com.project.app.notebook.repository.NotebookTransactionRepository;
import com.project.app.notebook.service.NotebookTransactionService;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotebookTransactionServiceImpl implements NotebookTransactionService {

    /** Tối đa 100 tỷ mỗi lần thu nhập / chi tiêu. */
    private static final BigDecimal MAX_TRANSACTION_AMOUNT = new BigDecimal("100000000000");

    private final NotebookTransactionRepository notebookTransactionRepository;
    private final NotebookBookRepository notebookBookRepository;
    private final NotebookBookServiceImpl notebookBookService;
    private final CategoryService categoryService;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NotebookTransactionResponse> getTransactions(Long userId, Long bookId, String period) {
        notebookBookService.findOwnedBook(userId, bookId);
        LocalDateTime[] range = resolvePeriodRange(period);

        List<NotebookTransaction> transactions = notebookTransactionRepository
                .findAllByBookIdAndUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                        bookId, userId, range[0], range[1]);

        Set<Long> categoryIds = transactions.stream()
                .map(NotebookTransaction::getCategoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, CategoryItem> categories =
                categoryService.findItemsByIdsIncludingDeleted(categoryIds);

        return transactions.stream()
                .map(tx -> toResponse(tx, categories.get(tx.getCategoryId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public NotebookTransactionResponse getTransaction(Long userId, String transactionCode) {
        NotebookTransaction transaction = findOwnedTransaction(userId, transactionCode);
        return toDetailResponse(transaction);
    }

    @Override
    @Transactional
    public NotebookTransactionResponse createTransaction(Long userId, NotebookTransactionRequest request) {
        validateTransactionType(request.getType());
        validateAmount(request.getAmount());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        NotebookBook book = resolveTargetBook(userId, request.getBookId());
        CategoryItem category = categoryService.requireUserOwnedItem(userId, request.getCategoryId());
        applyBalanceChange(book, request.getType(), request.getAmount(), false);
        notebookBookRepository.save(book);

        NotebookTransaction transaction = NotebookTransaction.builder()
                .user(user)
                .book(book)
                .amount(request.getAmount())
                .type(request.getType())
                .note(trimToNull(request.getNote()))
                .categoryId(category.getId())
                .categoryName(category.getLabel())
                .transactionCode(generateTransactionCode())
                .build();

        if (request.getEntryDate() != null) {
            LocalDate today = LocalDate.now();
            LocalDate entryDate = request.getEntryDate();
            if (entryDate.isAfter(today)) {
                throw new AppException(ErrorCode.NOTEBOOK_INVALID_ENTRY_DATE);
            }
            transaction.setCreatedAt(LocalDateTime.of(entryDate, LocalTime.of(12, 0)));
        }

        return toDetailResponse(notebookTransactionRepository.save(transaction));
    }

    @Override
    @Transactional
    public NotebookTransactionResponse updateTransaction(
            Long userId,
            String transactionCode,
            NotebookTransactionRequest request) {
        validateTransactionType(request.getType());
        validateAmount(request.getAmount());

        NotebookTransaction existing = findOwnedTransaction(userId, transactionCode);
        NotebookBook book = existing.getBook();
        CategoryItem category = categoryService.requireUserOwnedItem(userId, request.getCategoryId());

        reverseBalanceChange(book, existing.getType(), existing.getAmount());
        applyBalanceChange(book, request.getType(), request.getAmount(), false);
        notebookBookRepository.save(book);

        existing.setAmount(request.getAmount());
        existing.setType(request.getType());
        existing.setNote(trimToNull(request.getNote()));
        existing.setCategoryId(category.getId());
        existing.setCategoryName(category.getLabel());

        return toDetailResponse(notebookTransactionRepository.save(existing));
    }

    @Override
    @Transactional
    public void deleteTransaction(Long userId, String transactionCode) {
        NotebookTransaction existing = findOwnedTransaction(userId, transactionCode);
        NotebookBook book = existing.getBook();

        reverseBalanceChange(book, existing.getType(), existing.getAmount());
        notebookBookRepository.save(book);
        notebookTransactionRepository.delete(existing);
    }

    private NotebookBook resolveTargetBook(Long userId, Long bookId) {
        if (bookId == null) {
            return notebookBookService.getOrCreateCashBookEntity(userId);
        }
        return notebookBookService.findOwnedBook(userId, bookId);
    }

    private void validateTransactionType(NotebookTransactionType type) {
        if (type != NotebookTransactionType.EXPENSE && type != NotebookTransactionType.INCOME) {
            throw new AppException(ErrorCode.NOTEBOOK_INVALID_TRANSACTION_TYPE);
        }
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ONE) < 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Số tiền phải lớn hơn 0");
        }
        if (amount.compareTo(MAX_TRANSACTION_AMOUNT) > 0) {
            throw new AppException(ErrorCode.NOTEBOOK_AMOUNT_EXCEEDED);
        }
    }

    private void applyBalanceChange(
            NotebookBook book,
            NotebookTransactionType type,
            BigDecimal amount,
            boolean isReverse) {
        if (type == NotebookTransactionType.EXPENSE) {
            if (!isReverse && book.getBalance().compareTo(amount) < 0) {
                throw new AppException(ErrorCode.NOTEBOOK_INSUFFICIENT_BALANCE);
            }
            book.setBalance(book.getBalance().subtract(amount));
        } else {
            book.setBalance(book.getBalance().add(amount));
        }
    }

    private void reverseBalanceChange(NotebookBook book, NotebookTransactionType type, BigDecimal amount) {
        if (type == NotebookTransactionType.EXPENSE) {
            book.setBalance(book.getBalance().add(amount));
        } else {
            if (book.getBalance().compareTo(amount) < 0) {
                throw new AppException(ErrorCode.NOTEBOOK_INSUFFICIENT_BALANCE);
            }
            book.setBalance(book.getBalance().subtract(amount));
        }
    }

    private NotebookTransaction findOwnedTransaction(Long userId, String transactionCode) {
        return notebookTransactionRepository.findByTransactionCodeAndUserId(transactionCode, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_TRANSACTION_NOT_FOUND));
    }

    private NotebookTransactionResponse toDetailResponse(NotebookTransaction transaction) {
        CategoryItem category = categoryService
                .findItemIncludingDeleted(transaction.getCategoryId())
                .orElse(null);
        return toResponse(transaction, category);
    }

    private NotebookTransactionResponse toResponse(NotebookTransaction transaction, CategoryItem category) {
        boolean deleted = category == null || category.isDeleted();
        if (category == null) {
            return NotebookTransactionResponse.from(transaction, null, null, null, deleted);
        }
        return NotebookTransactionResponse.from(
                transaction,
                category.getIcon(),
                category.getColor(),
                category.getBgColor(),
                deleted);
    }

    private String generateTransactionCode() {
        return "NB" + System.currentTimeMillis()
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    private LocalDateTime[] resolvePeriodRange(String period) {
        LocalDate today = LocalDate.now();
        LocalDateTime start;
        LocalDateTime end = LocalDateTime.of(today, LocalTime.MAX);

        if ("TODAY".equalsIgnoreCase(period)) {
            start = LocalDateTime.of(today, LocalTime.MIN);
        } else if ("WEEK".equalsIgnoreCase(period)) {
            start = LocalDateTime.of(today.minusDays(6), LocalTime.MIN);
        } else if ("YEAR".equalsIgnoreCase(period)) {
            start = LocalDateTime.of(today.withDayOfYear(1), LocalTime.MIN);
        } else {
            start = LocalDateTime.of(today.withDayOfMonth(1), LocalTime.MIN);
        }

        return new LocalDateTime[] { start, end };
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
