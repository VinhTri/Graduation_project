package com.project.app.post.service;

import com.project.app.post.dto.response.PostResponse;
import java.util.List;

public interface PostService {
    List<PostResponse> getActivePosts();
}
