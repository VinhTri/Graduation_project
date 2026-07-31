package com.project.app.post.controller.admin;

import com.project.app.post.dto.request.PostRequest;
import com.project.app.post.dto.response.PostResponse;
import com.project.app.post.service.admin.AdminPostService;
import com.project.app.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/posts")
public class AdminPostController {

    private final AdminPostService postService;

    @Autowired
    public AdminPostController(AdminPostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PostResponse>>> getAllPosts() {
        return ResponseEntity.ok(ApiResponse.<List<PostResponse>>builder()
                .success(true)
                .message("Lấy danh sách bài viết thành công")
                .data(postService.getAllPosts())
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<PostResponse>builder()
                .success(true)
                .message("Lấy bài viết thành công")
                .data(postService.getPostById(id))
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(@Valid @RequestBody PostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<PostResponse>builder()
                .success(true)
                .message("Tạo bài viết thành công")
                .data(postService.createPost(request))
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(@PathVariable Long id, @Valid @RequestBody PostRequest request) {
        return ResponseEntity.ok(ApiResponse.<PostResponse>builder()
                .success(true)
                .message("Cập nhật bài viết thành công")
                .data(postService.updatePost(id, request))
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa bài viết thành công")
                .build());
    }
}
