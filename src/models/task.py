"""
Task Model - 异步任务队列
"""
from datetime import datetime
from typing import Any, Optional, TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from .project import Project, Episode, Shot


class Task(Base, UUIDMixin, TimestampMixin):
    """异步任务记录"""

    __tablename__ = "tasks"

    # 关联
    project_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    episode_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("episodes.id", ondelete="SET NULL"),
        nullable=True,
    )
    shot_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("shots.id", ondelete="SET NULL"),
        nullable=True,
    )

    # 任务类型: script / character / image / video / voice / lipsync / edit
    task_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # 状态: pending / running / completed / failed / cancelled
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)

    # 优先级 (越大越优先)
    priority: Mapped[int] = mapped_column(Integer, default=0)

    # 任务数据
    payload: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    result: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 执行信息
    worker_id: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )  # Celery worker ID
    celery_task_id: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )  # Celery task ID
    progress: Mapped[int] = mapped_column(Integer, default=0)  # 进度百分比 0-100

    # 时间戳
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    project: Mapped[Optional["Project"]] = relationship(
        "Project", back_populates="tasks"
    )

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, type={self.task_type}, status={self.status})>"

    def mark_running(self, worker_id: Optional[str] = None) -> None:
        """标记任务开始执行"""
        self.status = "running"
        self.started_at = datetime.utcnow()
        if worker_id:
            self.worker_id = worker_id

    def mark_completed(self, result: Optional[dict[str, Any]] = None) -> None:
        """标记任务完成"""
        self.status = "completed"
        self.progress = 100
        self.completed_at = datetime.utcnow()
        if result:
            self.result = result

    def mark_failed(self, error: str) -> None:
        """标记任务失败"""
        self.status = "failed"
        self.error = error
        self.completed_at = datetime.utcnow()

    def update_progress(self, progress: int) -> None:
        """更新进度"""
        self.progress = min(100, max(0, progress))
