"""
Project, Episode, Shot Models
"""
from datetime import datetime
from typing import Any, Optional, TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, Integer, Float, DateTime
from sqlalchemy.dialects.postgresql import JSONB, UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from .character import Character
    from .task import Task


class Project(Base, UUIDMixin, TimestampMixin):
    """AI漫剧项目"""

    __tablename__ = "projects"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 项目配置
    style: Mapped[str] = mapped_column(
        String(50), default="anime"
    )  # anime / manga / realistic / 3d
    target_platform: Mapped[str] = mapped_column(
        String(50), default="douyin"
    )  # douyin / kuaishou / bilibili / youtube
    aspect_ratio: Mapped[str] = mapped_column(
        String(10), default="9:16"
    )  # 9:16 竖屏 / 16:9 横屏

    # 状态: draft / processing / completed / failed
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)

    # 用户配置的 API Keys 和设置
    user_config: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    settings: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    # Relationships
    episodes: Mapped[list["Episode"]] = relationship(
        "Episode",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="Episode.episode_number",
    )
    characters: Mapped[list["Character"]] = relationship(
        "Character",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Project(id={self.id}, title={self.title}, status={self.status})>"


class Episode(Base, UUIDMixin, TimestampMixin):
    """漫剧集/章节"""

    __tablename__ = "episodes"

    project_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    episode_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # 剧本
    script_input: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # 用户输入的原始剧本
    parsed_script: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )  # LLM 解析后的结构化剧本

    # 状态: pending / script_done / rendering / lipsync / editing / completed / failed
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)

    # 输出
    video_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    thumbnail_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 秒

    metadata: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="episodes")
    shots: Mapped[list["Shot"]] = relationship(
        "Shot",
        back_populates="episode",
        cascade="all, delete-orphan",
        order_by="Shot.shot_number",
    )

    def __repr__(self) -> str:
        return f"<Episode(id={self.id}, number={self.episode_number}, status={self.status})>"


class Shot(Base, UUIDMixin, TimestampMixin):
    """单个镜头 - 漫剧的最小生成单位"""

    __tablename__ = "shots"

    episode_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("episodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    shot_number: Mapped[int] = mapped_column(Integer, nullable=False)
    duration: Mapped[float] = mapped_column(Float, default=5.0)  # 镜头时长(秒)

    # 镜头描述
    scene_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    camera_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # wide_shot / medium_shot / close_up
    camera_movement: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # static / pan_left / pan_right / zoom_in

    # 角色和对白
    characters: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(UUID(as_uuid=False)), nullable=True
    )  # 角色 ID 数组
    dialog: Mapped[dict[str, Any]] = mapped_column(
        JSONB, default=dict
    )  # {"speaker": "角色名", "text": "对白", "emotion": "情绪"}

    # Prompts
    image_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    negative_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    video_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 生成的资产路径
    image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    video_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    audio_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    lipsync_video_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    final_video_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # 状态
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    episode: Mapped["Episode"] = relationship("Episode", back_populates="shots")

    def __repr__(self) -> str:
        return f"<Shot(id={self.id}, number={self.shot_number}, status={self.status})>"
