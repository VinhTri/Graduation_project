package com.project.app.access.controller;
import com.project.app.access.dto.AdminAccessRequest; import com.project.app.access.service.AdminAccessService; import com.project.app.auth.security.CustomUserDetails; import com.project.app.common.dto.ApiResponse; import jakarta.validation.Valid; import lombok.RequiredArgsConstructor; import org.springframework.http.ResponseEntity; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.security.core.annotation.AuthenticationPrincipal; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/v1/admin/access") @RequiredArgsConstructor @PreAuthorize("hasRole('ADMIN')")
public class AdminAccessController { private final AdminAccessService service;
 @GetMapping public ResponseEntity<ApiResponse<List<Map<String,Object>>>> list(){return ok("Lấy phân quyền thành công",service.list());}
 @PutMapping("/{userId}") public ResponseEntity<ApiResponse<Map<String,Object>>> update(@PathVariable Long userId,@Valid @RequestBody AdminAccessRequest request,@AuthenticationPrincipal CustomUserDetails actor){return ok("Đã cập nhật phân quyền",service.update(userId,request,actor.getUser()));}
 private <T> ResponseEntity<ApiResponse<T>> ok(String m,T d){return ResponseEntity.ok(ApiResponse.<T>builder().success(true).message(m).data(d).build());}}
