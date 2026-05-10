from enum import Enum

from pydantic import BaseModel, Field


class CaptionMode(str, Enum):
    creative = "creative"
    detailed = "detailed"


class CaptionItem(BaseModel):
    text: str = Field(..., min_length=1)
    confidence: float = Field(..., ge=0, le=1)
    strategy: str


class CaptionResponse(BaseModel):
    captions: list[str]
    items: list[CaptionItem]
    mode: CaptionMode
    model: str

