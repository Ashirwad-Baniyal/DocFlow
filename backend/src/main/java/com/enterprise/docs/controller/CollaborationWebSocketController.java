package com.enterprise.docs.controller;

import com.enterprise.docs.dto.CollaborationDto;
import com.enterprise.docs.service.CollaborationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

/**
 * WebSocket STOMP message handlers for real-time document collaboration.
 *
 * <p>Client publishes to: /app/doc/{docId}/operation | /app/doc/{docId}/cursor | /app/doc/{docId}/presence
 * <p>Server broadcasts to: /topic/doc/{docId} | /topic/doc/{docId}/cursor | /topic/doc/{docId}/presence
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class CollaborationWebSocketController {

    private final CollaborationService collaborationService;

    /**
     * Receive a document operation (INSERT/DELETE/REPLACE), merge it via CRDT,
     * and broadcast the confirmed operation to all subscribers.
     */
    @MessageMapping("/doc/{docId}/operation")
    public void handleOperation(@DestinationVariable String docId,
                                @Payload CollaborationDto.DocumentOperation operation) {
        operation.setDocId(docId);
        collaborationService.applyOperation(operation);
        log.debug("WS operation received: docId={} type={}", docId, operation.getType());
    }

    /**
     * Receive a cursor position update and relay it to all collaborators.
     */
    @MessageMapping("/doc/{docId}/cursor")
    public void handleCursor(@DestinationVariable String docId,
                             @Payload CollaborationDto.CursorPosition cursor) {
        cursor.setDocId(docId);
        collaborationService.handleCursorMove(cursor);
    }

    /**
     * Receive a user presence update (JOINED/LEFT) and update the Redis presence store.
     */
    @MessageMapping("/doc/{docId}/presence")
    public void handlePresence(@DestinationVariable String docId,
                               @Payload CollaborationDto.UserPresence presence) {
        presence.setDocId(docId);
        collaborationService.trackPresence(presence);
    }
}
