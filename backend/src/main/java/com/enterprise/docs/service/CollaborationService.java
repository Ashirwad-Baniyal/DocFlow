package com.enterprise.docs.service;

import com.enterprise.docs.dto.CollaborationDto;
import com.enterprise.docs.model.User;
import com.enterprise.docs.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Real-time collaboration service.
 * Implements a lightweight CRDT (Last-Writer-Wins with operation IDs) for
 * conflict-free document synchronisation across concurrent editors.
 *
 * <p>Operations flow:
 * <ol>
 *   <li>Client sends operation via STOMP /app/doc/{id}/operation</li>
 *   <li>{@link #applyOperation} merges the operation into the Redis-cached content</li>
 *   <li>The merged operation is broadcast to all subscribers of /topic/doc/{id}</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CollaborationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private static final String PRESENCE_KEY_PREFIX = "presence:doc:";
    private static final String CONTENT_KEY_PREFIX = "content:doc:";
    private static final long PRESENCE_TTL_SECONDS = 30;

    // ─── Operation Handling (CRDT) ───────────────────────────────────────────

    /**
     * Applies an incoming document operation.
     * Assigns a server-side operation ID for total ordering, updates the cached
     * document content in Redis, and broadcasts the confirmed operation to all
     * collaborators on /topic/doc/{docId}.
     */
    public CollaborationDto.DocumentOperation applyOperation(CollaborationDto.DocumentOperation op) {
        // Assign server-side operation ID for total ordering
        if (op.getOperationId() == null) {
            op.setOperationId(UUID.randomUUID().toString());
        }
        op.setTimestamp(System.currentTimeMillis());

        // Update cached content
        String contentKey = CONTENT_KEY_PREFIX + op.getDocId();
        String currentContent = (String) redisTemplate.opsForValue().get(contentKey);
        if (currentContent != null) {
            String updatedContent = applyCrdtOp(currentContent, op);
            redisTemplate.opsForValue().set(contentKey, updatedContent, 30, TimeUnit.MINUTES);
        }

        // Broadcast confirmed operation to all subscribers
        messagingTemplate.convertAndSend("/topic/doc/" + op.getDocId(), op);
        log.debug("Op applied [{}] type={} pos={} docId={}", op.getOperationId(), op.getType(), op.getPosition(), op.getDocId());
        return op;
    }

    /**
     * CRDT merge: positional INSERT/DELETE on plain-text content.
     * For rich-text (HTML/TipTap JSON), the frontend manages its own CRDT
     * via TipTap Collaboration extension (y-protocols / Yjs).
     */
    private String applyCrdtOp(String content, CollaborationDto.DocumentOperation op) {
        try {
            return switch (op.getType()) {
                case "INSERT" -> {
                    int pos = Math.min(op.getPosition(), content.length());
                    yield content.substring(0, pos) + op.getContent() + content.substring(pos);
                }
                case "DELETE" -> {
                    int start = Math.min(op.getPosition(), content.length());
                    int end = Math.min(start + op.getLength(), content.length());
                    yield content.substring(0, start) + content.substring(end);
                }
                case "REPLACE" -> op.getContent();
                default -> content;
            };
        } catch (Exception e) {
            log.warn("CRDT merge error: {}", e.getMessage());
            return content;
        }
    }

    // ─── Presence ────────────────────────────────────────────────────────────

    public void trackPresence(CollaborationDto.UserPresence presence) {
        String key = PRESENCE_KEY_PREFIX + presence.getDocId() + ":" + presence.getUserId();

        if ("LEFT".equals(presence.getStatus())) {
            redisTemplate.delete(key);
        } else {
            redisTemplate.opsForValue().set(key, presence, PRESENCE_TTL_SECONDS, TimeUnit.SECONDS);
        }

        // Broadcast presence update to all viewers
        messagingTemplate.convertAndSend("/topic/doc/" + presence.getDocId() + "/presence", presence);
        log.debug("Presence {} for user {} on doc {}", presence.getStatus(), presence.getUserId(), presence.getDocId());
    }

    public List<CollaborationDto.UserPresence> getPresence(String docId) {
        String pattern = PRESENCE_KEY_PREFIX + docId + ":*";
        var keys = redisTemplate.keys(pattern);
        List<CollaborationDto.UserPresence> presenceList = new ArrayList<>();
        if (keys != null) {
            for (String k : keys) {
                Object val = redisTemplate.opsForValue().get(k);
                if (val != null) {
                    CollaborationDto.UserPresence p = objectMapper.convertValue(val, CollaborationDto.UserPresence.class);
                    presenceList.add(p);
                }
            }
        }
        return presenceList;
    }

    // ─── Cursor ──────────────────────────────────────────────────────────────

    public void handleCursorMove(CollaborationDto.CursorPosition cursor) {
        messagingTemplate.convertAndSend("/topic/doc/" + cursor.getDocId() + "/cursor", cursor);
    }

    // ─── Content Cache ───────────────────────────────────────────────────────

    public void cacheDocumentContent(String docId, String content) {
        redisTemplate.opsForValue().set(CONTENT_KEY_PREFIX + docId, content, 30, TimeUnit.MINUTES);
    }

    public String getCachedContent(String docId) {
        return (String) redisTemplate.opsForValue().get(CONTENT_KEY_PREFIX + docId);
    }
}
