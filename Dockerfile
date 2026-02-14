FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml uv.lock ./

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

# Install deps (no venv, system install)
RUN uv sync --locked

COPY . .

EXPOSE 8000

CMD [ "uv", "run","uvicorn", "src.main:app", "--host", "0.0.0.0",  "--port", "8000", "--workers", "1"]
