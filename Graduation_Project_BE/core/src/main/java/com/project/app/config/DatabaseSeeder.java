package com.project.app.config;

import com.project.app.user.entity.Role;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import org.springframework.jdbc.core.JdbcTemplate;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DatabaseSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        // Auto alter notifications type column if truncated in MySQL
        try {
            jdbcTemplate.execute("ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50)");
        } catch (Exception e) {
            // Ignore if table does not exist or already updated
        }

        // Seed Admin account
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User(
                "admin", 
                "admin@smartspend.com", 
                passwordEncoder.encode("admin123"), 
                Role.ADMIN, 
                true
            );
            userRepository.save(admin);
            System.out.println("Seeded ADMIN account: admin / admin123");
        }
    }
}
