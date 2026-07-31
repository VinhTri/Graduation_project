package com.project.app.post.service.admin;

import com.project.app.post.dto.request.PostRequest;
import com.project.app.post.dto.response.PostResponse;

import java.util.List;

public interface AdminPostService {
    List<PostResponse> getAllPosts();
    PostResponse getPostById(Long id);
    PostResponse createPost(PostRequest request);
    PostResponse updatePost(Long id, PostRequest request);
    void deletePost(Long id);
}
