package com.project.app.budget.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.budget.dto.request.CreateBudgetRequest;
import com.project.app.budget.dto.request.UpdateBudgetRequest;
import com.project.app.budget.dto.response.BudgetResponse;
import com.project.app.budget.service.BudgetService;
import com.project.app.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> list(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Thành công", budgetService.listBudgets(userDetails.getUser().getId()));
    }

    @GetMapping("/{budgetId}")
    public ResponseEntity<ApiResponse<BudgetResponse>> get(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long budgetId) {
        return ApiResponse.ok("Thành công", budgetService.getBudget(userDetails.getUser().getId(), budgetId));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> create(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateBudgetRequest request) {
        BudgetResponse budget = budgetService.createBudget(userDetails.getUser().getId(), request);
        return ApiResponse.ok("Tạo ngân sách thành công!", budget);
    }

    @PatchMapping("/{budgetId}")
    public ResponseEntity<ApiResponse<BudgetResponse>> update(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long budgetId,
            @Valid @RequestBody UpdateBudgetRequest request) {
        BudgetResponse budget = budgetService.updateBudget(userDetails.getUser().getId(), budgetId, request);
        return ApiResponse.ok("Cập nhật ngân sách thành công!", budget);
    }

    @DeleteMapping("/{budgetId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long budgetId) {
        budgetService.deleteBudget(userDetails.getUser().getId(), budgetId);
        return ApiResponse.ok("Xóa ngân sách thành công!");
    }
}
