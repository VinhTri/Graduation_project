package com.project.app.user.service;

import com.project.app.user.dto.response.UserDetailsResponse;
import com.project.app.user.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    void toggleUserStatus(Long userId);
    UserDetailsResponse getUserDetailsForAdmin(Long userId);
}
