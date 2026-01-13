"""
WebSocket Progress Handler - 实时进度推送
"""
import asyncio
import json
from typing import Any
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from starlette.websockets import WebSocketState

from src.db.redis import get_redis_client

router = APIRouter()


class ConnectionManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        # task_id -> list of WebSocket connections
        self.active_connections: dict[str, list[WebSocket]] = {}
        # user_id -> list of WebSocket connections (for user-level broadcasts)
        self.user_connections: dict[str, list[WebSocket]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        task_id: str | None = None,
        user_id: str | None = None,
    ):
        """接受 WebSocket 连接"""
        await websocket.accept()

        if task_id:
            if task_id not in self.active_connections:
                self.active_connections[task_id] = []
            self.active_connections[task_id].append(websocket)

        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)

    def disconnect(
        self,
        websocket: WebSocket,
        task_id: str | None = None,
        user_id: str | None = None,
    ):
        """断开 WebSocket 连接"""
        if task_id and task_id in self.active_connections:
            if websocket in self.active_connections[task_id]:
                self.active_connections[task_id].remove(websocket)
            if not self.active_connections[task_id]:
                del self.active_connections[task_id]

        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def send_personal_message(self, message: dict[str, Any], websocket: WebSocket):
        """发送个人消息"""
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.send_json(message)

    async def broadcast_to_task(self, task_id: str, message: dict[str, Any]):
        """向特定任务的所有连接广播消息"""
        if task_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[task_id]:
                try:
                    if connection.client_state == WebSocketState.CONNECTED:
                        await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)

            # 清理断开的连接
            for conn in disconnected:
                self.active_connections[task_id].remove(conn)

    async def broadcast_to_user(self, user_id: str, message: dict[str, Any]):
        """向特定用户的所有连接广播消息"""
        if user_id in self.user_connections:
            disconnected = []
            for connection in self.user_connections[user_id]:
                try:
                    if connection.client_state == WebSocketState.CONNECTED:
                        await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)

            # 清理断开的连接
            for conn in disconnected:
                self.user_connections[user_id].remove(conn)


# 全局连接管理器实例
manager = ConnectionManager()


@router.websocket("/ws/task/{task_id}")
async def websocket_task_progress(
    websocket: WebSocket,
    task_id: str,
    token: str = Query(None),
):
    """
    WebSocket endpoint for task progress updates.

    连接后会接收该任务的实时进度更新。

    Message format:
    {
        "type": "progress" | "stage_complete" | "error" | "complete",
        "task_id": "xxx",
        "data": {
            "stage": "script" | "character" | "storyboard" | "render" | "video" | "voice" | "lipsync" | "edit",
            "progress": 0-100,
            "message": "Processing...",
            "details": {...}
        },
        "timestamp": "2024-01-01T00:00:00Z"
    }
    """
    # TODO: 验证 token
    user_id = "anonymous"  # 应该从 token 解析

    await manager.connect(websocket, task_id=task_id, user_id=user_id)

    try:
        # 发送连接确认
        await manager.send_personal_message(
            {
                "type": "connected",
                "task_id": task_id,
                "message": "Connected to task progress stream",
                "timestamp": datetime.utcnow().isoformat(),
            },
            websocket,
        )

        # 订阅 Redis 频道获取进度更新
        redis = await get_redis_client()
        pubsub = redis.pubsub()
        channel = f"task:{task_id}:progress"

        await pubsub.subscribe(channel)

        # 同时监听 WebSocket 消息和 Redis 消息
        while True:
            # 检查 Redis 消息
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)
            if message and message["type"] == "message":
                data = json.loads(message["data"])
                await manager.send_personal_message(data, websocket)

                # 如果任务完成，关闭连接
                if data.get("type") in ("complete", "error", "cancelled"):
                    break

            # 检查 WebSocket 是否有消息（心跳等）
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=0.1,
                )
                # 处理客户端消息（如心跳）
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                pass

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, task_id=task_id, user_id=user_id)


@router.websocket("/ws/user")
async def websocket_user_notifications(
    websocket: WebSocket,
    token: str = Query(None),
):
    """
    WebSocket endpoint for user-level notifications.

    接收用户的所有任务通知和系统消息。

    Message format:
    {
        "type": "task_created" | "task_progress" | "task_complete" | "system",
        "data": {...},
        "timestamp": "2024-01-01T00:00:00Z"
    }
    """
    # TODO: 验证 token 并获取 user_id
    user_id = "anonymous"

    await manager.connect(websocket, user_id=user_id)

    try:
        # 发送连接确认
        await manager.send_personal_message(
            {
                "type": "connected",
                "message": "Connected to user notification stream",
                "timestamp": datetime.utcnow().isoformat(),
            },
            websocket,
        )

        # 订阅用户频道
        redis = await get_redis_client()
        pubsub = redis.pubsub()
        channel = f"user:{user_id}:notifications"

        await pubsub.subscribe(channel)

        while True:
            # 检查 Redis 消息
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)
            if message and message["type"] == "message":
                data = json.loads(message["data"])
                await manager.send_personal_message(data, websocket)

            # 心跳处理
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=0.1,
                )
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                pass

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, user_id=user_id)


async def publish_task_progress(
    task_id: str,
    stage: str,
    progress: float,
    message: str,
    details: dict[str, Any] | None = None,
    event_type: str = "progress",
):
    """
    发布任务进度到 Redis，供 WebSocket 推送。

    Args:
        task_id: 任务 ID
        stage: 当前阶段
        progress: 进度百分比 (0-100)
        message: 进度消息
        details: 额外详情
        event_type: 事件类型 (progress, stage_complete, error, complete)
    """
    redis = await get_redis_client()

    payload = {
        "type": event_type,
        "task_id": task_id,
        "data": {
            "stage": stage,
            "progress": progress,
            "message": message,
            "details": details or {},
        },
        "timestamp": datetime.utcnow().isoformat(),
    }

    await redis.publish(f"task:{task_id}:progress", json.dumps(payload))


async def publish_user_notification(
    user_id: str,
    notification_type: str,
    data: dict[str, Any],
):
    """
    发布用户通知到 Redis。

    Args:
        user_id: 用户 ID
        notification_type: 通知类型
        data: 通知数据
    """
    redis = await get_redis_client()

    payload = {
        "type": notification_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
    }

    await redis.publish(f"user:{user_id}:notifications", json.dumps(payload))
