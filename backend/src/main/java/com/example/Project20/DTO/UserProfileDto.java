package com.example.Project20.DTO;

import com.example.Project20.entity.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserProfileDto {
    private String username;
    private String email;
    private UserRole role;
    private String fullName;
    private Integer age;
    private String gender;
    private String phoneNumber;
    private String address;
    private Instant createdAt;
}
