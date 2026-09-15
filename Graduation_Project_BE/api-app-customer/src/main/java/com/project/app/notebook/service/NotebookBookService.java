package com.project.app.notebook.service;

import com.project.app.notebook.dto.NotebookBookResponse;

public interface NotebookBookService {

    NotebookBookResponse getOrCreateCashBook(Long userId);
}
