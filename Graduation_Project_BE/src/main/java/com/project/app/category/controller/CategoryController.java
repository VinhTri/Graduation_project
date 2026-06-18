package com.project.app.category.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.category.dto.request.CategoryGroupRequest;
import com.project.app.category.dto.request.CategoryItemRequest;
import com.project.app.category.dto.response.CategoryGroupResponse;
import com.project.app.category.dto.response.CategoryItemResponse;
import com.project.app.category.service.CategoryService;
import com.project.app.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryGroupResponse>>> getCategories(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<CategoryGroupResponse> response = categoryService.getCategoriesForUser(userDetails.getUser());
        
        return ResponseEntity.ok(ApiResponse.<List<CategoryGroupResponse>>builder()
                .success(true)
                .message("Lấy danh sách danh mục thành công")
                .data(response)
                .build());
    }

    @PostMapping("/groups")
    public ResponseEntity<ApiResponse<CategoryGroupResponse>> createGroup(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CategoryGroupRequest request) {
        
        CategoryGroupResponse response = categoryService.createGroup(userDetails.getUser(), request);
        
        return ResponseEntity.ok(ApiResponse.<CategoryGroupResponse>builder()
                .success(true)
                .message("Tạo nhóm danh mục thành công")
                .data(response)
                .build());
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CategoryItemResponse>> createItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CategoryItemRequest request) {
        
        CategoryItemResponse response = categoryService.createItem(userDetails.getUser(), request);
        
        return ResponseEntity.ok(ApiResponse.<CategoryItemResponse>builder()
                .success(true)
                .message("Tạo danh mục mới thành công")
                .data(response)
                .build());
    }
}
