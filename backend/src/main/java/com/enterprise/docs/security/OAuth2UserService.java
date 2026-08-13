package com.enterprise.docs.security;

import com.enterprise.docs.model.Role;
import com.enterprise.docs.model.User;
import com.enterprise.docs.repository.RoleRepository;
import com.enterprise.docs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Handles OAuth2 user loading. On first Google login, a local User record is created.
 * Subsequent logins update the avatar URL from Google profile data.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        return processOAuth2User(userRequest, oAuth2User);
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest request, OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");

        if (email == null) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        User user = userRepository.findByEmail(email).map(existingUser -> {
            // Update avatar on each login
            existingUser.setAvatarUrl(picture);
            return userRepository.save(existingUser);
        }).orElseGet(() -> registerNewOAuth2User(email, name, picture));

        log.info("OAuth2 login successful for user: {}", email);

        return new DefaultOAuth2User(
                Collections.singleton(
                        () -> user.getRoles().stream()
                                .findFirst()
                                .map(Role::getName)
                                .orElse("ROLE_USER")),
                attributes,
                "email"
        );
    }

    private User registerNewOAuth2User(String email, String name, String picture) {
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_USER").build()));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);

        User newUser = User.builder()
                .email(email)
                .fullName(name != null ? name : email)
                .avatarUrl(picture)
                .provider("GOOGLE")
                .enabled(true)
                .roles(roles)
                .build();

        return userRepository.save(newUser);
    }
}
