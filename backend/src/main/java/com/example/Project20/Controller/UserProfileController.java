package com.example.Project20.Controller;

import com.example.Project20.DTO.UpdateProfileRequestDto;
import com.example.Project20.DTO.UserProfileDto;
import com.example.Project20.entity.User;
import com.example.Project20.entity.UserRole;
import com.example.Project20.exception.ResourceNotFoundException;
import com.example.Project20.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<UserProfileDto> getProfile(Principal principal) {
        User user = findUser(principal.getName());
        return ResponseEntity.ok(toProfileDto(user));
    }

    @PutMapping
    public ResponseEntity<UserProfileDto> updateProfile(@Valid @RequestBody UpdateProfileRequestDto request, Principal principal) {
        User user = findUser(principal.getName());
        if (user.getRole() == UserRole.ADMIN) {
            throw new AccessDeniedException("Admin profile is locked and cannot be changed");
        }
        user.setFullName(request.getFullName());
        user.setAge(request.getAge());
        user.setGender(request.getGender());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAddress(request.getAddress());
        userRepository.save(user);
        return ResponseEntity.ok(toProfileDto(user));
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private UserProfileDto toProfileDto(User user) {
        return UserProfileDto.builder()
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .fullName(user.getFullName())
                .age(user.getAge())
                .gender(user.getGender())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
