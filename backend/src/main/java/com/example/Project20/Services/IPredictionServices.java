package com.example.Project20.Services;

import com.example.Project20.DTO.PredictionRequestDto;
import com.example.Project20.DTO.PredictionResponseDto;
import org.springframework.web.multipart.MultipartFile;
public interface IPredictionServices {

    PredictionResponseDto resnetClassifier(MultipartFile image);

    PredictionResponseDto cnnClassifier(MultipartFile image);

    PredictionResponseDto efficientNetClassifier(MultipartFile image);

}
