package com.project.app.user.controller.customer;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.friendship.dto.response.FriendshipRelationshipDto;
import com.project.app.friendship.service.FriendshipService;
import com.project.app.notebook.NotebookReminderTimes;
import com.project.app.user.dto.request.AppearanceRequest;
import com.project.app.user.dto.request.MoneyFormatRequest;
import com.project.app.user.dto.request.NotebookReminderRequest;
import com.project.app.user.dto.response.AppearanceResponse;
import com.project.app.user.dto.response.MoneyFormatResponse;
import com.project.app.user.dto.response.NotebookReminderResponse;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
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

    @PutMapping("/money-format")
    public ResponseEntity<ApiResponse<MoneyFormatResponse>> updateMoneyFormat(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody MoneyFormatRequest request) {
        User user = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy người dùng"));
        user.setMoneySuffix(request.getSuffix());
        user.setMoneySeparator(request.getSeparator());
        userRepository.save(user);

        userDetails.getUser().setMoneySuffix(request.getSuffix());
        userDetails.getUser().setMoneySeparator(request.getSeparator());

        MoneyFormatResponse payload = MoneyFormatResponse.builder()
                .suffix(user.resolvedMoneySuffix())
                .separator(user.resolvedMoneySeparator())
                .build();

        return ResponseEntity.ok(ApiResponse.<MoneyFormatResponse>builder()
                .success(true)
                .message("Cập nhật định dạng tiền tệ thành công")
                .data(payload)
                .build());
    }

    @PutMapping("/appearance")
    public ResponseEntity<ApiResponse<AppearanceResponse>> updateAppearance(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AppearanceRequest request) {
        User user = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy người dùng"));
        user.setThemeMode(request.getThemeMode());
        user.setLanguage(request.getLanguage());
        userRepository.save(user);

        userDetails.getUser().setThemeMode(request.getThemeMode());
        userDetails.getUser().setLanguage(request.getLanguage());

        AppearanceResponse payload = AppearanceResponse.builder()
                .themeMode(user.resolvedThemeMode())
                .language(user.resolvedLanguage())
                .build();

        return ResponseEntity.ok(ApiResponse.<AppearanceResponse>builder()
                .success(true)
                .message("Cập nhật giao diện thành công")
                .data(payload)
                .build());
    }

    @PutMapping("/notebook-reminder")
    public ResponseEntity<ApiResponse<NotebookReminderResponse>> updateNotebookReminder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody NotebookReminderRequest request) {
        boolean enabled = Boolean.TRUE.equals(request.getEnabled());
        LocalTime reminderTime = parseReminderTime(request.getReminderTime());

        if (enabled && reminderTime == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<NotebookReminderResponse>builder()
                            .success(false)
                            .message("Vui lòng chọn giờ nhắc nhở trong ngày")
                            .build());
        }

        User user = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy người dùng"));
        user.setNotebookReminderEnabled(enabled);
        user.setNotebookReminderTime(enabled ? reminderTime : user.getNotebookReminderTime());

        boolean appliesToday = false;
        if (!enabled) {
            user.setNotebookReminderLastSentOn(null);
        } else if (NotebookReminderTimes.isLaterToday(reminderTime)) {
            // Giờ chọn sau giờ hiện tại (21:00 → 21:50) → nhắc hôm nay khi tới giờ
            user.setNotebookReminderLastSentOn(null);
            appliesToday = true;
        } else {
            // Giờ chọn đã qua hoặc đúng phút hiện tại (21:00 → 20:58) → ngày mai
            user.setNotebookReminderLastSentOn(NotebookReminderTimes.today());
        }

        userRepository.save(user);
        userDetails.getUser().setNotebookReminderEnabled(enabled);
        userDetails.getUser().setNotebookReminderTime(user.getNotebookReminderTime());
        userDetails.getUser().setNotebookReminderLastSentOn(user.getNotebookReminderLastSentOn());

        return ResponseEntity.ok(ApiResponse.<NotebookReminderResponse>builder()
                .success(true)
                .message(enabled
                        ? (appliesToday
                            ? "Đã bật. Sẽ nhắc hôm nay khi tới giờ đã chọn"
                            : "Đã bật. Lần nhắc đầu vào ngày mai")
                        : "Đã tắt nhắc nhở ghi chép sổ tay")
                .data(toNotebookReminderResponse(user, appliesToday))
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
        userData.put("moneySuffix", user.resolvedMoneySuffix());
        userData.put("moneySeparator", user.resolvedMoneySeparator());
        userData.put("themeMode", user.resolvedThemeMode());
        userData.put("language", user.resolvedLanguage());
        userData.put("notebookReminderEnabled", user.isNotebookReminderEnabled());
        userData.put("notebookReminderTime", formatReminderTime(user.getNotebookReminderTime()));
        return userData;
    }

    private static NotebookReminderResponse toNotebookReminderResponse(User user, boolean appliesToday) {
        return NotebookReminderResponse.builder()
                .enabled(user.isNotebookReminderEnabled())
                .reminderTime(formatReminderTime(user.getNotebookReminderTime()))
                .appliesToday(appliesToday)
                .build();
    }

    private static LocalTime parseReminderTime(String value) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim();
        if (normalized.length() == 5) {
            return LocalTime.parse(normalized, DateTimeFormatter.ofPattern("HH:mm"));
        }
        return LocalTime.parse(normalized);
    }

    private static String formatReminderTime(LocalTime time) {
        if (time == null) return null;
        return time.format(DateTimeFormatter.ofPattern("HH:mm"));
    }
}
