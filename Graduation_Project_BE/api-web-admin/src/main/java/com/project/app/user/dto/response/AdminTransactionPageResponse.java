package com.project.app.user.dto.response;

import com.project.app.user.dto.response.TransactionHistoryResponse;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class AdminTransactionPageResponse {
    private List<TransactionHistoryResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
