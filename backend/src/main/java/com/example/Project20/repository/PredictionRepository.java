package com.example.Project20.repository;

import com.example.Project20.entity.Prediction;
import com.example.Project20.entity.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {

    @Query("""
            select p
            from Prediction p
            where p.user.username = :username
              and (:reviewStatus is null or p.reviewStatus = :reviewStatus)
              and (:modelName is null or lower(p.modelName) = lower(:modelName))
            order by p.createdAt desc
            """)
    Page<Prediction> findUserHistory(@Param("username") String username,
                                     @Param("modelName") String modelName,
                                     @Param("reviewStatus") ReviewStatus reviewStatus,
                                     Pageable pageable);

    Optional<Prediction> findByIdAndUserUsername(Long id, String username);
}
