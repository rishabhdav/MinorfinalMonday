package com.example.Project20.DTO;



import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PredictionRequestDto {

    @NotBlank(message = "Image cannot be empty")
    private String image;
}