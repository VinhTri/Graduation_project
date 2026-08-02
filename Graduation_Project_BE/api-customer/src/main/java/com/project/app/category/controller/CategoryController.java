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
    private final com.project.app.category.repository.CategoryItemRepository itemRepository;
    private final com.project.app.category.repository.CategoryGroupRepository groupRepository;

    @GetMapping("/test")
    public ResponseEntity<?> testCategories() {
        return ResponseEntity.ok(java.util.Map.of(
            "groups", groupRepository.findAll(),
            "items", itemRepository.findAll()
        ));
    }

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

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CategoryItemResponse>> updateItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long itemId,
            @Valid @RequestBody CategoryItemRequest request) {
        
        CategoryItemResponse response = categoryService.updateCategoryItem(itemId, userDetails.getUser(), request);
        
        return ResponseEntity.ok(ApiResponse.<CategoryItemResponse>builder()
                .success(true)
                .message("Cập nhật danh mục thành công")
                .data(response)
                .build());
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long itemId) {
        
        categoryService.softDeleteCategoryItem(itemId, userDetails.getUser());
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa danh mục thành công")
                .build());
    }

    @DeleteMapping("/groups/{groupId}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long groupId) {

        categoryService.softDeleteGroup(groupId, userDetails.getUser());

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa nhóm danh mục thành công")
                .build());
    }
}
