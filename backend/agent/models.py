"""
Pydantic models for FastAPI request/response bodies.
"""
from pydantic import BaseModel, Field


class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500, description="The research question")


class ResearchResponse(BaseModel):
    research_id: str = Field(..., description="UUID to use for the SSE stream endpoint")
