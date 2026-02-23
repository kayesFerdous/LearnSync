#!/bin/sh
set -e

# Run database initialization (Non-Alembic)
echo "Initializing database..."
uv run src/init_db.py

# Start the application
echo "Starting application..."
exec uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 1 --proxy-headers --forwarded-allow-ips '*'