package com.project.app.friendship.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.friendship.dto.response.FriendshipResponse;
import com.project.app.friendship.service.FriendshipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/friends")
public class FriendshipController {

    @Autowired
    private FriendshipService friendshipService;

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<FriendshipResponse>> sendFriendRequest(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String email) {
        
        FriendshipResponse response = friendshipService.sendFriendRequest(userDetails.getUser(), email);
        return ResponseEntity.ok(ApiResponse.<FriendshipResponse>builder()
                .success(true)
                .message("Gửi lời mời kết bạn thành công")
                .data(response)
                .build());
    }

    @PutMapping("/accept/{id}")
    public ResponseEntity<ApiResponse<FriendshipResponse>> acceptFriendRequest(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        
        FriendshipResponse response = friendshipService.acceptFriendRequest(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<FriendshipResponse>builder()
                .success(true)
                .message("Đã chấp nhận lời mời kết bạn")
                .data(response)
                .build());
    }

    @DeleteMapping("/reject/{id}")
    public ResponseEntity<ApiResponse<Void>> rejectFriendRequest(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        
        friendshipService.rejectFriendRequest(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã từ chối lời mời kết bạn")
                .build());
    }

    @DeleteMapping("/cancel/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelSentFriendRequest(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {

        friendshipService.cancelSentFriendRequest(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã hủy lời mời kết bạn")
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FriendshipResponse>>> getFriendsList(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<FriendshipResponse> friends = friendshipService.getFriendsList(userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.<List<FriendshipResponse>>builder()
                .success(true)
                .message("Lấy danh sách bạn bè thành công")
                .data(friends)
                .build());
    }

    @DeleteMapping("/remove/{id}")
    public ResponseEntity<ApiResponse<Void>> removeFriend(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        friendshipService.removeFriend(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã xóa bạn bè")
                .build());
    }

    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<List<FriendshipResponse>>> getPendingRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<FriendshipResponse> requests = friendshipService.getPendingRequests(userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.<List<FriendshipResponse>>builder()
                .success(true)
                .message("Lấy danh sách lời mời kết bạn thành công")
                .data(requests)
                .build());
    }

    @GetMapping("/sent-requests")
    public ResponseEntity<ApiResponse<List<FriendshipResponse>>> getSentPendingRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<FriendshipResponse> requests = friendshipService.getSentPendingRequests(userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.<List<FriendshipResponse>>builder()
                .success(true)
                .message("Lấy danh sách lời mời đang chờ thành công")
                .data(requests)
                .build());
    }
}
