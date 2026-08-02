package com.project.app.post.service.impl;

import com.project.app.post.dto.response.PostResponse;
import com.project.app.post.repository.PostRepository;
import com.project.app.post.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;

    @Autowired
    public PostServiceImpl(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Override
    public List<PostResponse> getActivePosts() {
        return postRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                .map(PostResponse::new)
                .collect(Collectors.toList());
    }
}
