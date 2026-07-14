package com.project.app.post.service.admin.impl;

import com.project.app.post.dto.request.PostRequest;
import com.project.app.post.service.admin.AdminPostService;
import com.project.app.post.dto.response.PostResponse;
import com.project.app.post.entity.Post;
import com.project.app.post.repository.PostRepository;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminPostServiceImpl implements AdminPostService {

    private final PostRepository postRepository;

    @Autowired
    public AdminPostServiceImpl(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Override
    public List<PostResponse> getAllPosts() {
        return postRepository.findAll().stream()
                .map(PostResponse::new)
                .collect(Collectors.toList());
    }

    @Override
    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));
        return new PostResponse(post);
    }

    @Override
    public PostResponse createPost(PostRequest request) {
        Post post = new Post();
        updateEntityFromRequest(post, request);
        return new PostResponse(postRepository.save(post));
    }

    @Override
    public PostResponse updatePost(Long id, PostRequest request) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));
        updateEntityFromRequest(post, request);
        return new PostResponse(postRepository.save(post));
    }

    @Override
    public void deletePost(Long id) {
        if (!postRepository.existsById(id)) {
            throw new AppException(ErrorCode.POST_NOT_FOUND);
        }
        postRepository.deleteById(id);
    }

    private void updateEntityFromRequest(Post post, PostRequest request) {
        post.setTitle(request.getTitle());
        post.setImageUrl(request.getImageUrl());
        post.setTargetLink(request.getTargetLink());
        post.setActive(request.getActive() != null ? request.getActive() : true);
    }
}
