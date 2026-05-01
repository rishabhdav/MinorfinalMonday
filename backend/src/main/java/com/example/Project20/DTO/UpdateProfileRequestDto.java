package com.example.Project20.DTO;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class UpdateProfileRequestDto {
    private String fullName;

    @Min(value = 0, message = "Age must be zero or positive")
    private Integer age;

    private String gender;

    private String phoneNumber;

    private String address;
}
