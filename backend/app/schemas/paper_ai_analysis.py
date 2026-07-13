from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PaperAnalysisOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    executive_summary: str = Field(
        description="A clear 2-3 sentence explanation of the paper."
    )

    why_it_matters: str = Field(
        description="Why this paper matters to engineers or researchers."
    )

    difficulty: Literal[
        "Beginner",
        "Intermediate",
        "Advanced",
        "Research",
    ]

    reading_time_minutes: int = Field(
        ge=1,
        le=120,
        description="Estimated minutes required to understand the paper.",
    )

    key_contributions: list[str] = Field(
        min_length=1,
        max_length=6,
    )

    limitations: list[str] = Field(
        min_length=1,
        max_length=6,
    )

    use_cases: list[str] = Field(
        min_length=1,
        max_length=6,
    )

    prerequisites: list[str] = Field(
        min_length=1,
        max_length=6,
    )

    target_roles: list[str] = Field(
        min_length=1,
        max_length=6,
    )
