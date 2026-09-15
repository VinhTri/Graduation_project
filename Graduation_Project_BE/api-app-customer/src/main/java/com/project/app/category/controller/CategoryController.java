package com.project.app.category.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.category.dto.request.CategoryGroupRequest;
import com.project.app.category.dto.request.CategoryItemRequest;
import com.project.app.category.dto.response.CategoryGroupResponse;
import com.project.app.category.dto.response.CategoryItemResponse;
import com.project.app.category.service.CategoryService;
import com.project.app.common.dto.ApiResponse;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
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
        Long userId = userDetails.getUser().getId();
        return ApiResponse.ok("Thành công", categoryService.getCategoriesForUser(userId));
    }

    @PostMapping("/groups")
    public ResponseEntity<ApiResponse<CategoryGroupResponse>> createGroup(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CategoryGroupRequest request) {
        Long userId = userDetails.getUser().getId();
        CategoryGroupResponse group = categoryService.createGroup(userId, request);
        return ApiResponse.ok("Tạo nhóm danh mục thành công", group);
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CategoryItemResponse>> createItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CategoryItemRequest request) {
        Long userId = userDetails.getUser().getId();
        CategoryItemResponse item = categoryService.createItem(userId, request);
        return ApiResponse.ok("Tạo danh mục thành công", item);
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> updateItem() {
        throw new AppException(ErrorCode.CATEGORY_ITEM_NOT_EDITABLE);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long itemId) {
        Long userId = userDetails.getUser().getId();
        categoryService.softDeleteItem(userId, itemId);
        return ApiResponse.ok("Xóa danh mục thành công");
    }

    @DeleteMapping("/groups/{groupId}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long groupId) {
        Long userId = userDetails.getUser().getId();
        categoryService.softDeleteGroup(userId, groupId);
        return ApiResponse.ok("Xóa nhóm danh mục thành công");
    }
}
