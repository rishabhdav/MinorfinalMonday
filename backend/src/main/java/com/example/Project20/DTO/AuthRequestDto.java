package com.example.Project20.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequestDto {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    @Email(message = "Email must be valid")
    private String email;

    private String fullName;

    @Min(value = 0, message = "Age must be zero or positive")
    private Integer age;

    private String gender;

    private String phoneNumber;

    private String address;
}
