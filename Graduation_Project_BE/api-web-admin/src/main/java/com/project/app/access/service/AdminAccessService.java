package com.project.app.access.service;

import com.project.app.access.dto.AdminAccessRequest;
import com.project.app.access.entity.AdminAccessProfile;
import com.project.app.access.repository.AdminAccessProfileRepository;
import com.project.app.audit.service.AdminAuditService;
import com.project.app.user.entity.Role;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor
public class AdminAccessService {
    private final AdminAccessProfileRepository repository; private final UserRepository userRepository; private final AdminAuditService auditService;
    private static final Map<String,List<String>> SCOPES=Map.of(
            "SUPER_ADMIN",List.of("ALL"),"FINANCE_ADMIN",List.of("FINANCE","RECONCILIATION","REPORTS"),
            "SUPPORT_ADMIN",List.of("USERS","SUPPORT","NOTIFICATIONS"),"CONTENT_ADMIN",List.of("CONTENT"),"ANALYST",List.of("REPORTS","READ_ONLY"));
    @Transactional(readOnly=true) public List<Map<String,Object>> list(){ return userRepository.findAll().stream().filter(u->u.getRole()==Role.ADMIN).map(this::row).toList(); }
    @Transactional public Map<String,Object> update(Long userId, AdminAccessRequest request, User actor){
        ensureSuper(actor); User target=userRepository.findById(userId).filter(u->u.getRole()==Role.ADMIN).orElseThrow(()->new IllegalArgumentException("Không tìm thấy quản trị viên"));
        if(target.getId().equals(actor.getId()) && (!request.active() || !"SUPER_ADMIN".equals(request.accessRole()))) throw new IllegalStateException("Không thể tự hạ quyền hoặc vô hiệu hóa tài khoản đang đăng nhập");
        AdminAccessProfile profile=repository.findByUserId(userId).orElseGet(AdminAccessProfile::new); profile.setUserId(userId); profile.setAccessRole(request.accessRole()); profile.setActive(request.active()); profile.setUpdatedBy(actor.getEmail()); repository.save(profile);
        auditService.record(actor,"ADMIN_ACCESS_UPDATE","USER",userId,request.accessRole()+" / active="+request.active()); return row(target);
    }
    private void ensureSuper(User actor){ var p=repository.findByUserId(actor.getId()); if(p.isPresent() && (!p.get().isActive() || !"SUPER_ADMIN".equals(p.get().getAccessRole()))) throw new AccessDeniedException("Chỉ Super Admin được phân quyền"); }
    private Map<String,Object> row(User user){ var p=repository.findByUserId(user.getId()); String role=p.map(AdminAccessProfile::getAccessRole).orElse("SUPER_ADMIN"); Map<String,Object> row=new LinkedHashMap<>(); row.put("id",user.getId()); row.put("username",user.getUsername()); row.put("email",user.getEmail()); row.put("accessRole",role); row.put("active",p.map(AdminAccessProfile::isActive).orElse(user.isActive())); row.put("scopes",SCOPES.getOrDefault(role,List.of())); row.put("updatedAt",p.map(AdminAccessProfile::getUpdatedAt).orElse(null)); return row; }
}
