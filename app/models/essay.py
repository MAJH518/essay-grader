from pydantic import BaseModel, Field, field_validator


class EssaySubmission(BaseModel):
    essay_text: str = Field(
        ...,
        min_length=50,
        max_length=5000,
        description="The full essay text to grade",
    )
    topic: str | None = Field(
        None,
        max_length=200,
        description="Optional: the essay prompt/topic",
    )
    essay_type: str = Field(
        "general",
        pattern=r"^(general|argumentative|narrative|descriptive)$",
    )
    focus: str | None = Field(
        None,
        max_length=500,
        description="Optional: specific aspects to focus grading on",
    )

    @field_validator("essay_text")
    @classmethod
    def must_not_be_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Essay text cannot be empty or whitespace-only")
        return v.strip()


class CorrectionItem(BaseModel):
    original: str
    corrected: str
    explanation: str


class CategoryResult(BaseModel):
    score: float = Field(..., ge=0, le=25)
    strengths: list[str]
    weaknesses: list[str]
    corrections: list[CorrectionItem] = []
    suggestions: list[str]


class GradingResult(BaseModel):
    total_score: float = Field(..., ge=0, le=100)
    grammar: CategoryResult
    vocabulary: CategoryResult
    structure: CategoryResult
    content: CategoryResult
    summary: str


class APIError(BaseModel):
    detail: str
    error_code: str
