package com.project.app.user.controller.customer;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.friendship.dto.response.FriendshipRelationshipDto;
import com.project.app.friendship.service.FriendshipService;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final FriendshipService friendshipService;
    private final WalletService walletService;
    private final WalletRepository walletRepository;

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
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchUser(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String email,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        String searchTerm = query != null && !query.isBlank()
                ? query.trim()
                : email != null ? email.trim() : "";
        if (searchTerm.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                    .success(false)
                    .message("Vui lòng nhập email hoặc tài khoản")
                    .build());
        }

        User currentUser = userDetails.getUser();
        if (currentUser.getEmail().equalsIgnoreCase(searchTerm)
                || currentUser.getUsername().equalsIgnoreCase(searchTerm)
                || searchTerm.equalsIgnoreCase(
                        Optional.ofNullable(walletService.getAccountNumberForUser(currentUser.getId())).orElse(""))) {
            return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                    .success(false)
                    .message("Không thể tìm kiếm chính mình")
                    .build());
        }

        Optional<User> optionalUser = userRepository.searchByEmail(searchTerm);
        if (optionalUser.isEmpty()) {
            optionalUser = userRepository.searchByUsername(searchTerm);
        }
        if (optionalUser.isEmpty()) {
            optionalUser = walletRepository.findUserByAccountNumberIgnoreCase(searchTerm);
        }
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
        userData.put("accountNumber", walletService.getAccountNumberForUser(targetUser.getId()));

        FriendshipRelationshipDto relationship = friendshipService.getRelationshipWithUser(currentUser, targetUser);
        userData.put("friendshipStatus", relationship.getFriendshipStatus());
        if (relationship.getFriendshipId() != null) {
            userData.put("friendshipId", relationship.getFriendshipId());
        }
        userData.put("requester", relationship.isRequester());

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Tìm thấy người dùng")
                .data(userData)
                .build());
    }

}
