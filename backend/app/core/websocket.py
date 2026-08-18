import json
import logging
from typing import Dict, List, Any
from fastapi import WebSocket

logger = logging.getLogger("citizen_journey")

class WebSocketManager:
    """
    Centralized WebSocket Manager supporting connection pooling, room subscriptions (per journey/conversation),
    and structured event broadcasting.
    """

    def __init__(self):
        # Maps room_id (e.g., journey_id or conversation_id) to list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        logger.info(f"WebSocket client connected to room: {room_id}")
        
        # Send initial connection confirmation event
        await self.send_event(websocket, {
            "type": "connection.connected",
            "room_id": room_id,
            "status": "connected",
            "message": "Realtime WebSocket channel active."
        })

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        logger.info(f"WebSocket client disconnected from room: {room_id}")

    async def send_event(self, websocket: WebSocket, event: dict):
        try:
            await websocket.send_text(json.dumps(event))
        except Exception as e:
            logger.error(f"Error sending event to WebSocket: {e}")

    async def broadcast_to_room(self, room_id: str, event: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await self.send_event(connection, event)

    async def broadcast_journey_progress(self, room_id: str, stage: str, status: str, message: str):
        event = {
            "type": "journey.progress",
            "journey_id": room_id,
            "stage": stage,
            "status": status,
            "message": message
        }
        await self.broadcast_to_room(room_id, event)

    async def broadcast_step_updated(self, room_id: str, step_key: str, state: str):
        event = {
            "type": "journey.step.updated",
            "journey_id": room_id,
            "step_key": step_key,
            "state": state
        }
        await self.broadcast_to_room(room_id, event)

    async def broadcast_global_event(self, event: dict):
        for room_id, connections in list(self.active_connections.items()):
            for connection in list(connections):
                await self.send_event(connection, event)

    async def broadcast_scheme_updated(self, scheme_id: str, version: int = 1):
        event = {
            "type": "scheme.updated",
            "scheme_id": scheme_id,
            "version": version,
            "timestamp": str(logging.Formatter().formatTime(logging.LogRecord("", 0, "", 0, "", (), None)))
        }
        await self.broadcast_global_event(event)

    async def broadcast_scheme_expired(self, scheme_id: str):
        event = {
            "type": "scheme.expired",
            "scheme_id": scheme_id,
            "timestamp": str(logging.Formatter().formatTime(logging.LogRecord("", 0, "", 0, "", (), None)))
        }
        await self.broadcast_global_event(event)

ws_manager = WebSocketManager()

