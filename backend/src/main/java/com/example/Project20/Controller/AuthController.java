package com.example.Project20.Controller;

import com.example.Project20.DTO.AuthRequestDto;
import com.example.Project20.DTO.AuthResponseDto;
import com.example.Project20.entity.User;
import com.example.Project20.entity.UserRole;
import com.example.Project20.repository.UserRepository;
import com.example.Project20.security.CustomUserDetailsService;
import com.example.Project20.security.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping({"/auth/login", "/login"})
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody AuthRequestDto request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
            String token = jwtUtils.generateToken(userDetails.getUsername());
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow();
            return ResponseEntity.ok(buildAuthResponse(user, token));
        } catch (AuthenticationException ex) {
            return ResponseEntity.status(401).body(AuthResponseDto.builder()
                    .accessToken(null)
                    .tokenType("Bearer")
                    .build());
        }
    }

    @PostMapping({"/auth/register", "/register"})
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody AuthRequestDto request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.status(409).body(AuthResponseDto.builder()
                    .accessToken(null)
                    .tokenType("Bearer")
                    .build());
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(409).body(AuthResponseDto.builder()
                    .accessToken(null)
                    .tokenType("Bearer")
                    .build());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .fullName(request.getFullName())
                .age(request.getAge())
                .gender(request.getGender())
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .role(UserRole.PATIENT)
                .createdAt(Instant.now())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);

        String token = jwtUtils.generateToken(user.getUsername());
        return ResponseEntity.ok(buildAuthResponse(user, token));
    }

    private AuthResponseDto buildAuthResponse(User user, String token) {
        return AuthResponseDto.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .fullName(user.getFullName())
                .age(user.getAge())
                .gender(user.getGender())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .build();
    }
}
