package com.example.Project20.repository;

import com.example.Project20.entity.Prediction;
import com.example.Project20.entity.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PredictionRepository extends MongoRepository<Prediction, String> {

    Page<Prediction> findByUsernameOrderByCreatedAtDesc(String username, Pageable pageable);

    Page<Prediction> findByUsernameAndModelNameIgnoreCaseOrderByCreatedAtDesc(String username, String modelName, Pageable pageable);

    Page<Prediction> findByUsernameAndReviewStatusOrderByCreatedAtDesc(String username, ReviewStatus reviewStatus, Pageable pageable);

    Page<Prediction> findByUsernameAndModelNameIgnoreCaseAndReviewStatusOrderByCreatedAtDesc(
            String username,
            String modelName,
            ReviewStatus reviewStatus,
            Pageable pageable
    );

    Optional<Prediction> findByIdAndUsername(String id, String username);

    Page<Prediction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Prediction> findByModelNameIgnoreCaseOrderByCreatedAtDesc(String modelName, Pageable pageable);

    Page<Prediction> findByReviewStatusOrderByCreatedAtDesc(ReviewStatus reviewStatus, Pageable pageable);

    Page<Prediction> findByModelNameIgnoreCaseAndReviewStatusOrderByCreatedAtDesc(
            String modelName,
            ReviewStatus reviewStatus,
            Pageable pageable
    );

    List<Prediction> findByUsernameOrderByCreatedAtDesc(String username);

    long countByUsername(String username);

    long countByUsernameAndReviewStatus(String username, ReviewStatus reviewStatus);

    long countByReviewStatus(ReviewStatus reviewStatus);
}
