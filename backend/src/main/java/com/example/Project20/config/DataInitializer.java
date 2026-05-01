package com.example.Project20.config;

import com.example.Project20.entity.User;
import com.example.Project20.entity.UserRole;
import com.example.Project20.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(value = "app.data.initialize", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin@project.com}")
    private String adminUsername;

    @Value("${app.admin.email:admin@project.com}")
    private String adminEmail;

    @Value("${app.admin.full-name:Fixed Admin}")
    private String adminFullName;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.findByUsername("demo@project.com").isEmpty()) {
            userRepository.save(User.builder()
                    .username("demo@project.com")
                    .email("demo@project.com")
                    .fullName("Demo Patient")
                    .age(42)
                    .gender("Female")
                    .phoneNumber("9999999999")
                    .address("Demo Address")
                    .role(UserRole.PATIENT)
                    .createdAt(Instant.now())
                    .password(passwordEncoder.encode("Demo@123"))
                    .build());
        }
        User fixedAdmin = userRepository.findByUsername(adminUsername)
                .orElse(User.builder()
                        .username(adminUsername)
                        .createdAt(Instant.now())
                        .build());

        fixedAdmin.setEmail(adminEmail);
        fixedAdmin.setFullName(adminFullName);
        fixedAdmin.setRole(UserRole.ADMIN);
        fixedAdmin.setPassword(passwordEncoder.encode(adminPassword));
        if (fixedAdmin.getCreatedAt() == null) {
            fixedAdmin.setCreatedAt(Instant.now());
        }
        userRepository.save(fixedAdmin);

        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        for (User admin : admins) {
            if (!adminUsername.equals(admin.getUsername())) {
                admin.setRole(UserRole.PATIENT);
                userRepository.save(admin);
            }
        }

    }
}
