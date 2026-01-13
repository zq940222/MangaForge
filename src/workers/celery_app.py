"""
Celery Application Configuration
"""
from celery import Celery

from src.config.settings import get_settings

settings = get_settings()

# 创建 Celery 应用
celery_app = Celery(
    "mangaforge",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "src.workers.tasks.generation",
        "src.workers.tasks.callbacks",
    ],
)

# Celery 配置
celery_app.conf.update(
    # 任务序列化
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # 时区
    timezone="UTC",
    enable_utc=True,

    # 任务结果
    result_expires=3600 * 24,  # 24 小时后过期
    task_track_started=True,

    # 任务执行
    task_acks_late=True,  # 任务完成后才确认
    worker_prefetch_multiplier=1,  # 每次只取一个任务

    # 任务超时
    task_soft_time_limit=3600,  # 软超时 1 小时
    task_time_limit=3660,  # 硬超时 1 小时 1 分钟

    # 任务重试
    task_default_retry_delay=60,  # 默认重试延迟 60 秒
    task_max_retries=3,

    # 任务路由
    task_routes={
        "src.workers.tasks.generation.*": {"queue": "generation"},
        "src.workers.tasks.callbacks.*": {"queue": "callbacks"},
    },

    # 队列配置
    task_queues={
        "generation": {
            "exchange": "generation",
            "routing_key": "generation",
        },
        "callbacks": {
            "exchange": "callbacks",
            "routing_key": "callbacks",
        },
        "celery": {
            "exchange": "celery",
            "routing_key": "celery",
        },
    },

    # Beat 定时任务（可选）
    beat_schedule={
        # 清理过期任务
        "cleanup-old-tasks": {
            "task": "src.workers.tasks.callbacks.cleanup_old_tasks",
            "schedule": 3600.0,  # 每小时
        },
    },
)


# 任务状态常量
class TaskStatus:
    PENDING = "pending"
    STARTED = "started"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRY = "retry"


# 生成阶段常量
class GenerationStage:
    SCRIPT = "script"
    CHARACTER = "character"
    STORYBOARD = "storyboard"
    RENDER = "render"
    VIDEO = "video"
    VOICE = "voice"
    LIPSYNC = "lipsync"
    EDIT = "edit"

    # 阶段顺序
    ORDER = [SCRIPT, CHARACTER, STORYBOARD, RENDER, VIDEO, VOICE, LIPSYNC, EDIT]

    # 阶段权重（用于计算总进度）
    WEIGHTS = {
        SCRIPT: 5,
        CHARACTER: 10,
        STORYBOARD: 5,
        RENDER: 25,
        VIDEO: 25,
        VOICE: 10,
        LIPSYNC: 15,
        EDIT: 5,
    }

    @classmethod
    def get_progress(cls, stage: str, stage_progress: float) -> float:
        """计算总体进度"""
        if stage not in cls.ORDER:
            return 0.0

        stage_index = cls.ORDER.index(stage)

        # 已完成阶段的权重
        completed_weight = sum(cls.WEIGHTS[s] for s in cls.ORDER[:stage_index])

        # 当前阶段的贡献
        current_weight = cls.WEIGHTS[stage] * (stage_progress / 100.0)

        total_weight = sum(cls.WEIGHTS.values())
        return (completed_weight + current_weight) / total_weight * 100
