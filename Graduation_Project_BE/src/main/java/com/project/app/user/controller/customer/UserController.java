package com.project.app.user.controller.customer;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.user.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import com.project.app.user.repository.UserRepository;
import java.util.Optional;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("username", user.getUsername());
        userData.put("email", user.getEmail());
        
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Lấy thông tin người dùng thành công")
                .data(userData)
                .build());
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchUserByEmail(
            @RequestParam String email,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        email = email.trim();
        System.out.println("Searching for email: '" + email + "'");
        
        if (userDetails.getUser().getEmail().equalsIgnoreCase(email)) {
            return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                    .success(false)
                    .message("Không thể tìm kiếm chính mình")
                    .build());
        }

        Optional<User> optionalUser = userRepository.searchByEmail(email);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                    .success(false)
                    .message("Không tìm thấy người dùng")
                    .build());
        }

        User targetUser = optionalUser.get();
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", targetUser.getId());
        userData.put("username", targetUser.getUsername());
        userData.put("email", targetUser.getEmail());

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Tìm thấy người dùng")
                .data(userData)
                .build());
    }

}
