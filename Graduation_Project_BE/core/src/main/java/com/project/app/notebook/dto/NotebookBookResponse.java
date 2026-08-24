package com.project.app.notebook.dto;

import com.project.app.notebook.entity.NotebookBook;
import com.project.app.notebook.enums.NotebookBookType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class NotebookBookResponse {

    Long id;
    String name;
    BigDecimal balance;
    NotebookBookType bookType;

    public static NotebookBookResponse from(NotebookBook book) {
        return NotebookBookResponse.builder()
                .id(book.getId())
                .name(book.getName())
                .balance(book.getBalance())
                .bookType(book.getBookType())
                .build();
    }
}
