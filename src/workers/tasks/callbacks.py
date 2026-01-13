"""
Task Callbacks - 任务回调和清理
"""
import json
from datetime import datetime, timedelta

from src.workers.celery_app import celery_app, TaskStatus


def run_async(coro):
    """在同步环境中运行异步协程"""
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _notify_user(user_id: str, notification_type: str, data: dict):
    """发送用户通知"""
    from src.db.redis import get_redis_client

    redis = await get_redis_client()
    payload = {
        "type": notification_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await redis.publish(f"user:{user_id}:notifications", json.dumps(payload))


async def _get_task_info(task_id: str):
    """获取任务信息"""
    from src.db.database import get_async_session
    from src.models import Task, Project
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    async with get_async_session() as session:
        result = await session.execute(
            select(Task)
            .options(selectinload(Task.project))
            .where(Task.id == task_id)
        )
        task = result.scalar_one_or_none()

        if task and task.project:
            return {
                "task_id": task.id,
                "project_id": task.project_id,
                "episode_id": task.episode_id,
                "user_id": task.project.user_id,
                "status": task.status,
                "result": task.result,
                "error": task.error,
            }
        return None


@celery_app.task(name="src.workers.tasks.callbacks.on_task_complete")
def on_task_complete(task_id: str):
    """
    任务完成回调。

    Args:
        task_id: 完成的任务 ID
    """
    async def _callback():
        task_info = await _get_task_info(task_id)
        if not task_info:
            return

        # 发送用户通知
        await _notify_user(
            task_info["user_id"],
            "task_complete",
            {
                "task_id": task_id,
                "project_id": task_info["project_id"],
                "episode_id": task_info["episode_id"],
                "message": "视频生成完成",
                "video_path": task_info.get("result", {}).get("video_path"),
            },
        )

    run_async(_callback())


@celery_app.task(name="src.workers.tasks.callbacks.on_task_failure")
def on_task_failure(task_id: str, error: str):
    """
    任务失败回调。

    Args:
        task_id: 失败的任务 ID
        error: 错误信息
    """
    async def _callback():
        task_info = await _get_task_info(task_id)
        if not task_info:
            return

        # 发送用户通知
        await _notify_user(
            task_info["user_id"],
            "task_failed",
            {
                "task_id": task_id,
                "project_id": task_info["project_id"],
                "episode_id": task_info["episode_id"],
                "message": "视频生成失败",
                "error": error,
            },
        )

    run_async(_callback())


@celery_app.task(name="src.workers.tasks.callbacks.cleanup_old_tasks")
def cleanup_old_tasks():
    """
    清理过期任务数据。

    定期运行，清理超过 7 天的已完成/失败任务的详细结果数据。
    """
    async def _cleanup():
        from src.db.database import get_async_session
        from src.models import Task
        from sqlalchemy import select, update

        threshold = datetime.utcnow() - timedelta(days=7)

        async with get_async_session() as session:
            # 查找需要清理的任务
            result = await session.execute(
                select(Task).where(
                    Task.completed_at < threshold,
                    Task.status.in_([TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]),
                )
            )
            old_tasks = result.scalars().all()

            cleaned_count = 0
            for task in old_tasks:
                # 保留基本信息，清理详细数据
                if task.result:
                    # 只保留 video_path 和基本状态
                    task.result = {
                        "video_path": task.result.get("video_path"),
                        "cleaned_at": datetime.utcnow().isoformat(),
                    }
                    cleaned_count += 1

            await session.commit()

            return {"cleaned_tasks": cleaned_count}

    return run_async(_cleanup())


@celery_app.task(name="src.workers.tasks.callbacks.send_webhook")
def send_webhook(webhook_url: str, payload: dict):
    """
    发送 webhook 通知。

    Args:
        webhook_url: Webhook URL
        payload: 要发送的数据
    """
    import httpx

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            return {"status": "success", "status_code": response.status_code}
    except Exception as e:
        return {"status": "error", "error": str(e)}
