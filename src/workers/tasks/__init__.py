"""
Celery tasks module.
"""
from src.workers.tasks.generation import generate_manga_video
from src.workers.tasks.callbacks import on_task_complete, on_task_failure, cleanup_old_tasks

__all__ = [
    "generate_manga_video",
    "on_task_complete",
    "on_task_failure",
    "cleanup_old_tasks",
]
