package com.example.Project20.config;

import com.example.Project20.entity.User;
import com.example.Project20.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.findByUsername("demo@project.com").isEmpty()) {
            userRepository.save(User.builder()
                    .username("demo@project.com")
                    .email("demo@project.com")
                    .password(passwordEncoder.encode("Demo@123"))
                    .build());
        }
    }
}
