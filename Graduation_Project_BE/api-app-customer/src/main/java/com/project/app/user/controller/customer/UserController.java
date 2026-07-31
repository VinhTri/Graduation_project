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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif");
    private static final long MAX_AVATAR_BYTES = 5L * 1024 * 1024;

    private final UserRepository userRepository;
    private final FriendshipService friendshipService;
    private final WalletService walletService;
    private final WalletRepository walletRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userRepository.findById(userDetails.getUser().getId())
                .orElse(userDetails.getUser());
        Map<String, Object> userData = buildUserPayload(user);
        userData.put("accountNumber", walletService.getAccountNumberForUser(user.getId()));

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Lấy thông tin người dùng thành công")
                .data(userData)
                .build());
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadAvatar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .message("Vui lòng chọn ảnh đại diện")
                            .build());
        }

        if (file.getSize() > MAX_AVATAR_BYTES) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .message("Ảnh không được vượt quá 5MB")
                            .build());
        }

        String originalName = StringUtils.cleanPath(
                Optional.ofNullable(file.getOriginalFilename()).orElse("avatar.jpg"));
        if (originalName.contains("..")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .message("Tên file không hợp lệ")
                            .build());
        }

        String extension = "";
        int dot = originalName.lastIndexOf('.');
        if (dot != -1) {
            extension = originalName.substring(dot).toLowerCase();
        }
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .message("Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF")
                            .build());
        }

        String contentType = Optional.ofNullable(file.getContentType()).orElse("");
        if (!contentType.isBlank() && !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .message("File phải là ảnh hợp lệ")
                            .build());
        }

        try {
            Path avatarDir = Paths.get("uploads", "avatars").toAbsolutePath().normalize();
            Files.createDirectories(avatarDir);

            String newFileName = "u" + userDetails.getUser().getId() + "_" + UUID.randomUUID() + extension;
            Path target = avatarDir.resolve(newFileName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = "/uploads/avatars/" + newFileName;
            User user = userRepository.findById(userDetails.getUser().getId())
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy người dùng"));
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);

            // Keep auth principal in sync for the rest of this request
            userDetails.getUser().setAvatarUrl(avatarUrl);

            Map<String, Object> payload = buildUserPayload(user);
            payload.put("accountNumber", walletService.getAccountNumberForUser(user.getId()));

            return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                    .success(true)
                    .message("Cập nhật ảnh đại diện thành công")
                    .data(payload)
                    .build());
        } catch (IOException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .message("Không thể lưu ảnh đại diện. Vui lòng thử lại.")
                            .build());
        }
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
        Map<String, Object> userData = buildUserPayload(targetUser);
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

    private Map<String, Object> buildUserPayload(User user) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("username", user.getUsername());
        userData.put("email", user.getEmail());
        userData.put("createdAt", user.getCreatedAt());
        userData.put("isActive", user.isActive());
        userData.put("avatarUrl", user.getAvatarUrl());
        return userData;
    }
}
