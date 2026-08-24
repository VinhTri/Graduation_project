package com.project.app.user.service.admin;

import com.project.app.user.dto.response.UserDetailsResponse;
import com.project.app.user.dto.response.UserResponse;
import com.project.app.user.dto.response.AdminTransactionPageResponse;

import java.util.List;

public interface AdminUserService {
    List<UserResponse> getAllUsers();
    void updateUserStatus(Long userId, boolean active);
    UserDetailsResponse getUserDetailsForAdmin(Long userId);
    AdminTransactionPageResponse getUserTransactions(Long userId, int page, int size);
}
