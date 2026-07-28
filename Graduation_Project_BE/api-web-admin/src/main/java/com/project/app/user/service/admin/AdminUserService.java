package com.project.app.user.service.admin;

import com.project.app.user.dto.response.UserDetailsResponse;
import com.project.app.user.dto.response.UserResponse;

import java.util.List;

public interface AdminUserService {
    List<UserResponse> getAllUsers();
    void toggleUserStatus(Long userId);
    UserDetailsResponse getUserDetailsForAdmin(Long userId);
}
