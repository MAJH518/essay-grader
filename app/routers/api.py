import os
from pathlib import Path

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from jinja2 import Environment, FileSystemLoader
from openai import AuthenticationError, RateLimitError, APITimeoutError

from app.models.essay import EssaySubmission, GradingResult
from app.services import get_grader
from app.services.grader import EssayGrader

router = APIRouter()
_TEMPLATE_DIR = Path(__file__).resolve().parent.parent.parent / "templates"
_jinja_env = Environment(loader=FileSystemLoader(str(_TEMPLATE_DIR)))


@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    template = _jinja_env.get_template("index.html")
    return HTMLResponse(template.render({"request": request}))


@router.post("/api/grade", response_model=GradingResult)
async def grade_essay(
    submission: EssaySubmission,
    grader: EssayGrader = Depends(get_grader),
):
    try:
        result = await grader.grade(
            submission.essay_text,
            submission.topic,
            submission.essay_type,
            submission.focus,
        )
        return result
    except AuthenticationError:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=502, detail="AI service configuration error"
        )
    except RateLimitError:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="The service is experiencing high demand. Please wait a moment and try again.",
        )
    except APITimeoutError:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=504,
            detail="The AI is taking too long. Please try with a shorter essay or try again later.",
        )
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/health")
async def health():
    return {"status": "ok"}
