import uuid
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from app.core.utils import utc_now


class CloudAccount(Base):
    __tablename__ = "cloud_accounts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str]
    provider: Mapped[str]  # aws | gcp | azure | on_prem
    external_account_id: Mapped[str]
    status: Mapped[str] = mapped_column(default="active")  # active | inactive | error
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)
