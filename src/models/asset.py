"""
Asset Model - 资产管理
"""
from typing import Any, Optional

from sqlalchemy import ForeignKey, String, Text, BigInteger
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, UUIDMixin


class Asset(Base, UUIDMixin, TimestampMixin):
    """所有生成的资产文件"""

    __tablename__ = "assets"

    project_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # 资产类型: image / video / audio / model / workflow
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # 文件信息
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    size_bytes: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    # 元数据
    metadata: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    def __repr__(self) -> str:
        return f"<Asset(id={self.id}, type={self.asset_type}, name={self.name})>"

    @property
    def size_mb(self) -> float:
        """Get file size in MB."""
        if self.size_bytes:
            return self.size_bytes / (1024 * 1024)
        return 0.0

    @property
    def extension(self) -> str:
        """Get file extension."""
        if self.path:
            parts = self.path.rsplit(".", 1)
            if len(parts) > 1:
                return parts[-1].lower()
        return ""
