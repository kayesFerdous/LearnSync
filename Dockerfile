FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml uv.lock ./

# Install deps (no venv, system install)
RUN uv sync --locked

COPY . .

EXPOSE 8000

CMD [ "uv", "run","uvicorn", "src.main:app", "--host", "0.0.0.0",  "--port", "8000", "--workers", "1"]
