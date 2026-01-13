"""
Character Model
"""
from typing import Any, Optional, TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from .project import Project


class Character(Base, UUIDMixin, TimestampMixin):
    """漫剧角色定义"""

    __tablename__ = "characters"

    project_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # 基本信息
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 外貌描述
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    age_range: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    personality: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 性格特征

    # 视觉资产
    reference_images: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(Text), nullable=True
    )  # 参考图路径数组
    lora_path: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )  # LoRA 模型路径
    ip_adapter_embedding: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )  # IP-Adapter 嵌入路径
    trigger_word: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # LoRA 触发词

    # 语音资产
    voice_sample_path: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )  # 声音样本路径
    voice_settings: Mapped[dict[str, Any]] = mapped_column(
        JSONB, default=dict
    )  # 语音合成设置

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="characters")

    def __repr__(self) -> str:
        return f"<Character(id={self.id}, name={self.name})>"

    def to_prompt_description(self) -> str:
        """生成用于图像提示词的角色描述"""
        parts = []

        if self.name:
            parts.append(self.name)

        if self.gender:
            parts.append(self.gender)

        if self.age_range:
            parts.append(self.age_range)

        if self.description:
            parts.append(self.description)

        if self.trigger_word:
            parts.append(f"<lora:{self.trigger_word}>")

        return ", ".join(parts)
