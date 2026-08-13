package com.enterprise.docs.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Local development configuration.
 * Activated by Spring profile "local".
 * Provides in-memory substitutes for Redis and disables Kafka consumer startup.
 */
@Configuration
@Profile("local")
public class LocalDevConfig {

    /**
     * Simple in-memory CacheManager replacing the Redis-backed one.
     * Caches documents and users in-process — data is lost on restart.
     */
    @Bean
    @Primary
    public CacheManager localCacheManager() {
        return new ConcurrentMapCacheManager("documents", "users", "sessions");
    }

    /**
     * No-op RedisTemplate backed by an in-memory map.
     * Allows services that @Autowire RedisTemplate to work without a real Redis server.
     */
    @Bean
    @Primary
    public RedisTemplate<String, Object> localRedisTemplate() {
        // Return a stub that delegates to an in-memory map
        return new NoOpRedisTemplate();
    }

    @Bean
    @Primary
    public org.springframework.kafka.core.KafkaTemplate<String, String> localKafkaTemplate() {
        return new org.springframework.kafka.core.KafkaTemplate<String, String>(
            new org.springframework.kafka.core.ProducerFactory<String, String>() {
                @Override
                public org.apache.kafka.clients.producer.Producer<String, String> createProducer() {
                    return null;
                }
            }
        ) {
            @Override
            public java.util.concurrent.CompletableFuture<org.springframework.kafka.support.SendResult<String, String>> send(
                    String topic, String key, String data) {
                return java.util.concurrent.CompletableFuture.completedFuture(null);
            }
        };
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    /**
     * A minimal RedisTemplate stub that uses a ConcurrentHashMap for key-value storage.
     * Only opsForValue().get/set/delete are implemented — sufficient for the local profile.
     */
    static class NoOpRedisTemplate extends RedisTemplate<String, Object> {

        private final ConcurrentHashMap<String, Object> store = new ConcurrentHashMap<>();

        @Override
        public org.springframework.data.redis.core.ValueOperations<String, Object> opsForValue() {
            return new org.springframework.data.redis.core.ValueOperations<>() {
                @Override public void set(String key, Object value) { store.put(key, value); }
                @Override public void set(String key, Object value, long timeout, TimeUnit unit) { store.put(key, value); }
                @Override public void set(String key, Object value, java.time.Duration timeout) { store.put(key, value); }
                @Override public Boolean setIfAbsent(String key, Object value) { return store.putIfAbsent(key, value) == null; }
                @Override public Boolean setIfAbsent(String key, Object value, long timeout, TimeUnit unit) { return store.putIfAbsent(key, value) == null; }
                @Override public Boolean setIfAbsent(String key, Object value, java.time.Duration timeout) { return store.putIfAbsent(key, value) == null; }
                @Override public Boolean setIfPresent(String key, Object value) { if (!store.containsKey(key)) return false; store.put(key, value); return true; }
                @Override public Boolean setIfPresent(String key, Object value, long timeout, TimeUnit unit) { return setIfPresent(key, value); }
                @Override public Boolean setIfPresent(String key, Object value, java.time.Duration timeout) { return setIfPresent(key, value); }
                @Override public void multiSet(java.util.Map<? extends String, ?> map) { store.putAll(map); }
                @Override public Boolean multiSetIfAbsent(java.util.Map<? extends String, ?> map) { map.forEach(store::putIfAbsent); return true; }
                @Override public Object get(Object key) { return store.get(key); }
                @Override public Object getAndDelete(String key) { return store.remove(key); }
                @Override public Object getAndExpire(String key, long timeout, TimeUnit unit) { return store.get(key); }
                @Override public Object getAndExpire(String key, java.time.Duration timeout) { return store.get(key); }
                @Override public Object getAndPersist(String key) { return store.get(key); }
                @Override public Object getAndSet(String key, Object value) { return store.put(key, value); }
                @Override public java.util.List<Object> multiGet(java.util.Collection<String> keys) { return keys.stream().map(store::get).toList(); }
                @Override public Long increment(String key) { store.merge(key, 1L, (a, b) -> ((Long)a) + 1L); return (Long) store.get(key); }
                @Override public Long increment(String key, long delta) { store.merge(key, delta, (a, b) -> ((Long)a) + delta); return (Long) store.get(key); }
                @Override public Double increment(String key, double delta) { return 0.0; }
                @Override public Long decrement(String key) { return 0L; }
                @Override public Long decrement(String key, long delta) { return 0L; }
                @Override public Integer append(String key, String value) { return 0; }
                @Override public String get(String key, long start, long end) { return ""; }
                @Override public void set(String key, Object value, long offset) { store.put(key, value); }
                @Override public Long size(String key) { return 0L; }
                @Override public Boolean setBit(String key, long offset, boolean value) { return false; }
                @Override public Boolean getBit(String key, long offset) { return false; }
                @Override public java.util.List<Long> bitField(String key, org.springframework.data.redis.connection.BitFieldSubCommands subCommands) { return java.util.Collections.emptyList(); }
                @Override public RedisTemplate<String, Object> getOperations() { return NoOpRedisTemplate.this; }
            };
        }

        @Override
        public Boolean hasKey(String key) { return false; }

        @Override
        public Boolean delete(String key) { return true; }

        @Override
        public java.util.Set<String> keys(String pattern) { return java.util.Collections.emptySet(); }

        @Override
        public void afterPropertiesSet() { /* no-op — no real connection factory */ }
    }
}
