import json
import logging

from app.models.essay import GradingResult, FocusResult
from app.services.deepseek_client import DeepSeekClient
from app.prompts.essay_grader import (
    SYSTEM_PROMPT,
    FOCUS_SYSTEM_PROMPT,
    build_user_prompt,
    build_focus_prompt,
)

logger = logging.getLogger(__name__)


class EssayGrader:
    def __init__(self, client: DeepSeekClient):
        self.client = client
        self.max_retries = 1

    async def grade(
        self,
        essay_text: str,
        topic: str | None,
        essay_type: str,
        focus: str | None = None,
    ) -> GradingResult | FocusResult:
        if focus:
            return await self._grade_focused(essay_text, topic, focus)

        user_prompt = build_user_prompt(essay_text, topic, essay_type)

        last_error = None
        for attempt in range(self.max_retries + 1):
            try:
                raw = await self.client.grade_essay(SYSTEM_PROMPT, user_prompt)
                data = json.loads(raw)
                return GradingResult(**data)
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning("Parse attempt %d failed: %s", attempt + 1, e)
                last_error = e
                user_prompt = (
                    "CRITICAL: You MUST respond with valid JSON only. "
                    "No markdown, no explanations outside the JSON.\n\n"
                    + user_prompt
                )

        raise ValueError(f"Failed to parse grading result after retries: {last_error}")

    async def _grade_focused(
        self,
        essay_text: str,
        topic: str | None,
        focus: str,
    ) -> FocusResult:
        user_prompt = build_focus_prompt(essay_text, topic, focus)

        last_error = None
        for attempt in range(self.max_retries + 1):
            try:
                raw = await self.client.grade_essay(FOCUS_SYSTEM_PROMPT, user_prompt)
                data = json.loads(raw)
                return FocusResult(**data)
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning("Focus parse attempt %d failed: %s", attempt + 1, e)
                last_error = e
                user_prompt = (
                    "CRITICAL: You MUST respond with valid JSON only. "
                    "No markdown, no explanations outside the JSON.\n\n"
                    + user_prompt
                )

        raise ValueError(f"Failed to parse focus result after retries: {last_error}")
