from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
import uuid


class ChatRequest(BaseModel):
    message: str
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class CopilotMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: str
    role: str
    content: str
    created_at: datetime
