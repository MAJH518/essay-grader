import json
import logging

from app.models.essay import GradingResult
from app.services.deepseek_client import DeepSeekClient
from app.prompts.essay_grader import SYSTEM_PROMPT, build_user_prompt

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
    ) -> GradingResult:
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
