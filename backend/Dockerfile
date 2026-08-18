# ============================================================
# Backend Dockerfile — Spring Boot 3 / Java 21
# Multi-stage build (Maven build → JRE runtime)
# ============================================================

# ─────────────────────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build

LABEL maintainer="engineering@docs.internal"
LABEL stage="builder"

WORKDIR /workspace

# Cache Maven dependencies first (layer-cache optimization)
COPY pom.xml .
RUN mvn dependency:go-offline -B --no-transfer-progress

# Copy source and build
COPY src ./src

RUN mvn clean package \
      -DskipTests \
      -B \
      --no-transfer-progress \
      -Dspring.profiles.active=docker \
  && ls -lh target/*.jar

# ─────────────────────────────────────────────────────────────
# Stage 2: Runtime
# ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL maintainer="engineering@docs.internal"
LABEL version="1.0.0"
LABEL description="Google Docs Clone — Spring Boot Backend"

# Install runtime dependencies
RUN apk add --no-cache \
      tzdata \
      curl \
      wget \
      dumb-init \
  && cp /usr/share/zoneinfo/UTC /etc/localtime \
  && echo "UTC" > /etc/timezone

# Create non-root user and group for security
RUN addgroup -S appgroup \
 && adduser  -S appuser -G appgroup -h /home/appuser -s /bin/sh

WORKDIR /app

# Copy the fat-jar from the build stage
COPY --from=build --chown=appuser:appgroup /workspace/target/*.jar app.jar

# Create logs directory
RUN mkdir -p /app/logs \
 && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

# JVM tuning for containers (Java 21 auto-detects cgroups)
ENV JAVA_OPTS="\
  -Xms128m \
  -Xmx384m \
  -XX:+UseContainerSupport \
  -XX:+ExitOnOutOfMemoryError \
  -Dfile.encoding=UTF-8 \
  -Dspring.profiles.active=docker"

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Use dumb-init to handle PID 1 correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
