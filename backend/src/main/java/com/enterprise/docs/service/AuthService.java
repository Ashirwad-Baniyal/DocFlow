package com.enterprise.docs.service;

import com.enterprise.docs.dto.AuthDto;
import com.enterprise.docs.exception.ResourceNotFoundException;
import com.enterprise.docs.exception.UnauthorizedException;
import com.enterprise.docs.kafka.KafkaProducerService;
import com.enterprise.docs.model.Role;
import com.enterprise.docs.model.User;
import com.enterprise.docs.repository.RoleRepository;
import com.enterprise.docs.repository.UserRepository;
import com.enterprise.docs.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Authentication service: registration, login, token refresh, and logout.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final AuditService auditService;
    private final KafkaProducerService kafkaProducer;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    // ─── Registration ────────────────────────────────────────────────────────

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request, String ip) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_USER").build()));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .provider("LOCAL")
                .enabled(true)
                .roles(roles)
                .build();

        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        auditService.log(user.getId(), "USER_REGISTER", "User registered with email: " + user.getEmail(), ip);
        kafkaProducer.publishAuditEvent(user.getId(), "USER_REGISTER", "New registration", ip);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        return buildAuthResponse(userDetails, user);
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request, String ip) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        auditService.log(user.getId(), "USER_LOGIN", "Login from IP: " + ip, ip);
        kafkaProducer.publishAuditEvent(user.getId(), "USER_LOGIN", "Login event", ip);

        return buildAuthResponse(userDetails, user);
    }

    // ─── Token Refresh ───────────────────────────────────────────────────────

    public AuthDto.AuthResponse refreshToken(AuthDto.TokenRefreshRequest request, String ip) {
        String refreshToken = request.getRefreshToken();

        if (!tokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String username = tokenProvider.extractUsername(refreshToken);

        // Check if token is blacklisted (invalidated via logout)
        String blacklistKey = "blacklist:" + refreshToken;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(blacklistKey))) {
            throw new UnauthorizedException("Refresh token has been invalidated");
        }

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", username));

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        return buildAuthResponse(userDetails, user);
    }

    // ─── Logout ──────────────────────────────────────────────────────────────

    public void logout(String accessToken, String refreshToken) {
        long accessTtl = 86400L;
        long refreshTtl = refreshExpirationMs / 1000;

        if (accessToken != null) {
            redisTemplate.opsForValue().set("blacklist:" + accessToken, "true", accessTtl, TimeUnit.SECONDS);
        }
        if (refreshToken != null) {
            redisTemplate.opsForValue().set("blacklist:" + refreshToken, "true", refreshTtl, TimeUnit.SECONDS);
        }
        log.info("Tokens invalidated via logout");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private AuthDto.AuthResponse buildAuthResponse(UserDetails userDetails, User user) {
        String accessToken = tokenProvider.generateToken(userDetails);
        String refreshToken = tokenProvider.generateRefreshToken(userDetails);

        AuthDto.UserDto userDto = new AuthDto.UserDto();
        userDto.setId(user.getId());
        userDto.setEmail(user.getEmail());
        userDto.setFullName(user.getFullName());
        userDto.setAvatarUrl(user.getAvatarUrl());
        userDto.setRoles(user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet()));

        return new AuthDto.AuthResponse(accessToken, refreshToken, 86400000L, userDto);
    }
}
