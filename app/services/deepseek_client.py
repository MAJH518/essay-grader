import logging
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


class DeepSeekClient:
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com",
        )

    async def grade_essay(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str = "deepseek-chat",
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> str:
        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        if content is None:
            raise ValueError("DeepSeek API returned empty response")
        return content
