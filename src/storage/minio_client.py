"""
MinIO Object Storage Client
"""
import io
from datetime import timedelta
from pathlib import Path
from typing import BinaryIO, Optional, Union
from uuid import uuid4

from minio import Minio
from minio.error import S3Error

from src.config.settings import get_settings

settings = get_settings()

# Global storage instance
_storage: Optional["MinioStorage"] = None


class MinioStorage:
    """MinIO 对象存储客户端封装"""

    def __init__(
        self,
        endpoint: str,
        access_key: str,
        secret_key: str,
        bucket: str,
        secure: bool = False,
    ):
        self.client = Minio(
            endpoint=endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure,
        )
        self.bucket = bucket
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        """确保 bucket 存在"""
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

    def _generate_path(
        self,
        project_id: str,
        asset_type: str,
        filename: str,
    ) -> str:
        """生成存储路径: projects/{project_id}/{asset_type}/{uuid}_{filename}"""
        unique_id = str(uuid4())[:8]
        return f"projects/{project_id}/{asset_type}/{unique_id}_{filename}"

    def upload_file(
        self,
        file_path: Union[str, Path],
        project_id: str,
        asset_type: str,
        filename: Optional[str] = None,
        content_type: Optional[str] = None,
    ) -> str:
        """
        上传本地文件到 MinIO

        Args:
            file_path: 本地文件路径
            project_id: 项目 ID
            asset_type: 资产类型 (image/video/audio/model)
            filename: 自定义文件名（默认使用原文件名）
            content_type: MIME 类型

        Returns:
            存储路径
        """
        file_path = Path(file_path)
        if not filename:
            filename = file_path.name

        object_name = self._generate_path(project_id, asset_type, filename)

        self.client.fput_object(
            bucket_name=self.bucket,
            object_name=object_name,
            file_path=str(file_path),
            content_type=content_type,
        )

        return object_name

    def upload_bytes(
        self,
        data: bytes,
        project_id: str,
        asset_type: str,
        filename: str,
        content_type: Optional[str] = None,
    ) -> str:
        """
        上传字节数据到 MinIO

        Args:
            data: 字节数据
            project_id: 项目 ID
            asset_type: 资产类型
            filename: 文件名
            content_type: MIME 类型

        Returns:
            存储路径
        """
        object_name = self._generate_path(project_id, asset_type, filename)
        data_stream = io.BytesIO(data)

        self.client.put_object(
            bucket_name=self.bucket,
            object_name=object_name,
            data=data_stream,
            length=len(data),
            content_type=content_type,
        )

        return object_name

    def upload_stream(
        self,
        stream: BinaryIO,
        project_id: str,
        asset_type: str,
        filename: str,
        length: int,
        content_type: Optional[str] = None,
    ) -> str:
        """
        上传流数据到 MinIO

        Args:
            stream: 二进制流
            project_id: 项目 ID
            asset_type: 资产类型
            filename: 文件名
            length: 数据长度
            content_type: MIME 类型

        Returns:
            存储路径
        """
        object_name = self._generate_path(project_id, asset_type, filename)

        self.client.put_object(
            bucket_name=self.bucket,
            object_name=object_name,
            data=stream,
            length=length,
            content_type=content_type,
        )

        return object_name

    def download_file(
        self,
        object_name: str,
        destination: Union[str, Path],
    ) -> Path:
        """
        下载文件到本地

        Args:
            object_name: 对象名称（存储路径）
            destination: 本地目标路径

        Returns:
            本地文件路径
        """
        destination = Path(destination)
        destination.parent.mkdir(parents=True, exist_ok=True)

        self.client.fget_object(
            bucket_name=self.bucket,
            object_name=object_name,
            file_path=str(destination),
        )

        return destination

    def download_bytes(self, object_name: str) -> bytes:
        """
        下载文件为字节数据

        Args:
            object_name: 对象名称

        Returns:
            文件字节数据
        """
        response = self.client.get_object(
            bucket_name=self.bucket,
            object_name=object_name,
        )
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def get_presigned_url(
        self,
        object_name: str,
        expires: timedelta = timedelta(hours=1),
    ) -> str:
        """
        获取预签名 URL（用于临时访问）

        Args:
            object_name: 对象名称
            expires: 过期时间

        Returns:
            预签名 URL
        """
        return self.client.presigned_get_object(
            bucket_name=self.bucket,
            object_name=object_name,
            expires=expires,
        )

    def get_public_url(self, object_name: str) -> str:
        """
        获取公开访问 URL（需要 bucket 设置为公开）

        Args:
            object_name: 对象名称

        Returns:
            公开 URL
        """
        protocol = "https" if settings.minio_secure else "http"
        return f"{protocol}://{settings.minio_endpoint}/{self.bucket}/{object_name}"

    def delete(self, object_name: str) -> bool:
        """
        删除对象

        Args:
            object_name: 对象名称

        Returns:
            是否成功
        """
        try:
            self.client.remove_object(
                bucket_name=self.bucket,
                object_name=object_name,
            )
            return True
        except S3Error:
            return False

    def exists(self, object_name: str) -> bool:
        """
        检查对象是否存在

        Args:
            object_name: 对象名称

        Returns:
            是否存在
        """
        try:
            self.client.stat_object(
                bucket_name=self.bucket,
                object_name=object_name,
            )
            return True
        except S3Error:
            return False

    def list_objects(
        self,
        prefix: str = "",
        recursive: bool = True,
    ) -> list[str]:
        """
        列出对象

        Args:
            prefix: 路径前缀
            recursive: 是否递归

        Returns:
            对象名称列表
        """
        objects = self.client.list_objects(
            bucket_name=self.bucket,
            prefix=prefix,
            recursive=recursive,
        )
        return [obj.object_name for obj in objects]

    def get_object_info(self, object_name: str) -> Optional[dict]:
        """
        获取对象信息

        Args:
            object_name: 对象名称

        Returns:
            对象信息字典
        """
        try:
            stat = self.client.stat_object(
                bucket_name=self.bucket,
                object_name=object_name,
            )
            return {
                "name": stat.object_name,
                "size": stat.size,
                "content_type": stat.content_type,
                "last_modified": stat.last_modified,
                "etag": stat.etag,
            }
        except S3Error:
            return None


def init_storage() -> MinioStorage:
    """初始化存储客户端"""
    global _storage
    if _storage is None:
        _storage = MinioStorage(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            bucket=settings.minio_bucket,
            secure=settings.minio_secure,
        )
    return _storage


def get_storage() -> MinioStorage:
    """获取存储客户端"""
    if _storage is None:
        return init_storage()
    return _storage
