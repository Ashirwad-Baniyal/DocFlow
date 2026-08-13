package com.enterprise.docs.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Springdoc OpenAPI 3 configuration with JWT Bearer security scheme.
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI enterpriseDocsOpenAPI() {
        SecurityScheme jwtScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .name("BearerAuth");

        return new OpenAPI()
                .info(new Info()
                        .title("Enterprise Docs API")
                        .description("Real-time collaborative document editor — REST API documentation")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("DocFlow Engineering")
                                .email("engineering@docflow.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development"),
                        new Server().url("https://api.docflow.com").description("Production")
                ))
                .addSecurityItem(new SecurityRequirement().addList("BearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("BearerAuth", jwtScheme));
    }
}
