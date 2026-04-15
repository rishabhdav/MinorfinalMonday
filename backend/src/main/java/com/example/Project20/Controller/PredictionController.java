package com.example.Project20.Controller;

import com.example.Project20.DTO.PredictionResponseDto;
import com.example.Project20.Services.IPredictionServices;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PredictionController {

    private final IPredictionServices predictionService;

    @PostMapping("/resnet-classifier")
    public ResponseEntity<PredictionResponseDto> resnet(
            @RequestParam("image") MultipartFile image){

        return ResponseEntity.ok(
                predictionService.resnetClassifier(image)
        );
    }

    @PostMapping("/cnn-classifier")
    public ResponseEntity<PredictionResponseDto> cnn(
            @RequestParam("image") MultipartFile image){

        return ResponseEntity.ok(
                predictionService.cnnClassifier(image)
        );
    }

    @PostMapping("/efficientnet-classifier")
    public ResponseEntity<PredictionResponseDto> efficientnet(
            @RequestParam("image") MultipartFile image){

        return ResponseEntity.ok(
                predictionService.efficientNetClassifier(image)
        );
    }
}
