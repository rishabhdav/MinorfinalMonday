package com.example.Project20.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserBriefDto {
    private String username;
    private String fullName;
    private String email;
    private Instant createdAt;
}
