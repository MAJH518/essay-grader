import os
from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
MAX_ESSAY_LENGTH = int(os.getenv("MAX_ESSAY_LENGTH", "5000"))
MIN_ESSAY_LENGTH = int(os.getenv("MIN_ESSAY_LENGTH", "50"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
