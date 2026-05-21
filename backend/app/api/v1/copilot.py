import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, engine
from app.models.copilot_message import CopilotMessage
from app.repositories.copilot_repo import CopilotRepository
from app.schemas.copilot import ChatRequest, CopilotMessageResponse
from app.services import copilot_service

router = APIRouter()


@router.post("/chat")
async def chat(payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    repo = CopilotRepository(db)

    # Persist user message before streaming begins
    await repo.create(
        CopilotMessage(session_id=payload.session_id, role="user", content=payload.message)
    )

    context = await copilot_service.build_context(db)
    history = await repo.get_history_as_dicts(payload.session_id)

    # Generator: stream chunks to client, then persist assistant reply
    async def event_stream():
        chunks: list[str] = []

        async for chunk in copilot_service.stream_chat(payload.message, context, history):
            chunks.append(chunk)
            yield f"data: {json.dumps({'content': chunk})}\n\n"

        full_reply = "".join(chunks)

        # Use a fresh session to persist the assistant message after the stream closes
        async with AsyncSession(engine, expire_on_commit=False) as save_db:
            save_db.add(
                CopilotMessage(
                    session_id=payload.session_id,
                    role="assistant",
                    content=full_reply,
                )
            )
            await save_db.commit()

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/history/{session_id}", response_model=list[CopilotMessageResponse])
async def get_history(session_id: str, db: AsyncSession = Depends(get_db)):
    repo = CopilotRepository(db)
    return await repo.get_history(session_id)
