package com.project.app.post.controller.customer;

import com.project.app.post.dto.response.PostResponse;
import com.project.app.post.service.PostService;
import com.project.app.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/posts")
public class PublicPostController {

    private final PostService postService;

    @Autowired
    public PublicPostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PostResponse>>> getActivePosts() {
        return ResponseEntity.ok(ApiResponse.<List<PostResponse>>builder()
                .success(true)
                .message("Lấy danh sách bài viết thành công")
                .data(postService.getActivePosts())
                .build());
    }
}
