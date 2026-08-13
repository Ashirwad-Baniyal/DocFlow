package com.enterprise.docs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enterprise Google Docs Clone — Spring Boot 3.2 / Java 21 Application Entry Point.
 *
 * <p>Features:
 * <ul>
 *   <li>JWT + OAuth2 Authentication (Google SSO)</li>
 *   <li>Real-time collaboration via Spring WebSocket / STOMP</li>
 *   <li>CRDT-based conflict-free document synchronisation</li>
 *   <li>Redis caching for sessions, presence and document content</li>
 *   <li>Kafka event-driven architecture for notifications and auditing</li>
 *   <li>Role-based access control (RBAC)</li>
 * </ul>
 */
@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
@EnableKafka
@EnableJpaAuditing
public class DocsApplication {

    public static void main(String[] args) {
        SpringApplication.run(DocsApplication.class, args);
    }
}
