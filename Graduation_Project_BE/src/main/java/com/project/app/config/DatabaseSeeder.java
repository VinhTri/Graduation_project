package com.project.app.config;

import com.project.app.user.entity.Role;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
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
