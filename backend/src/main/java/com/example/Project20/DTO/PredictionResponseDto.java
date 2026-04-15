package com.example.Project20.DTO;

import lombok.Data;
import java.util.List;

@Data
public class PredictionResponseDto {

    private int class_id;
    private String class_name;
    private double confidence;
    private List<List<Double>> probabilities;

}