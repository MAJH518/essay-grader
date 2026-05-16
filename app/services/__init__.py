from functools import lru_cache

from config import DEEPSEEK_API_KEY
from app.services.deepseek_client import DeepSeekClient
from app.services.grader import EssayGrader


@lru_cache()
def get_deepseek_client() -> DeepSeekClient:
    return DeepSeekClient(api_key=DEEPSEEK_API_KEY)


@lru_cache()
def get_grader() -> EssayGrader:
    return EssayGrader(client=get_deepseek_client())
