package com.project.app.access.repository;
import com.project.app.access.entity.AdminAccessProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AdminAccessProfileRepository extends JpaRepository<AdminAccessProfile,Long>{ Optional<AdminAccessProfile> findByUserId(Long userId); }
