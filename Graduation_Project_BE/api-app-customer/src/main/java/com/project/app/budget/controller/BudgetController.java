package com.project.app.budget.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.budget.dto.request.BudgetCreateRequest;
import com.project.app.budget.dto.request.BudgetUpdateRequest;
import com.project.app.budget.dto.response.BudgetResponse;
import com.project.app.budget.dto.response.BudgetSummaryResponse;
import com.project.app.budget.service.BudgetService;
import com.project.app.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getUserBudgets(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.<List<BudgetResponse>>builder()
                .success(true)
                .message("Lấy danh sách ngân sách thành công")
                .data(budgetService.getUserBudgets(userDetails.getUser()))
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> getBudgetById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<BudgetResponse>builder()
                .success(true)
                .message("Lấy thông tin ngân sách thành công")
                .data(budgetService.getBudgetById(userDetails.getUser(), id))
                .build());
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<BudgetSummaryResponse>> getBudgetSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.<BudgetSummaryResponse>builder()
                .success(true)
                .message("Lấy tổng quan ngân sách thành công")
                .data(budgetService.getBudgetSummary(userDetails.getUser()))
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> createBudget(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody BudgetCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.<BudgetResponse>builder()
                .success(true)
                .message("Tạo ngân sách thành công")
                .data(budgetService.createBudget(userDetails.getUser(), request))
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> updateBudget(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody BudgetUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.<BudgetResponse>builder()
                .success(true)
                .message("Cập nhật ngân sách thành công")
                .data(budgetService.updateBudget(userDetails.getUser(), id, request))
                .build());
    }

    @PostMapping("/{id}/cheat-spent")
    public ResponseEntity<ApiResponse<BudgetResponse>> cheatSpent(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody com.project.app.budget.dto.request.BudgetCheatRequest request) {
        return ResponseEntity.ok(ApiResponse.<BudgetResponse>builder()
                .success(true)
                .message("Cập nhật chi tiêu test thành công")
                .data(budgetService.cheatSpent(userDetails.getUser(), id, request.spentAmount()))
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        budgetService.deleteBudget(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa ngân sách thành công")
                .build());
    }
}
