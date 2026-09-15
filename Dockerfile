FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8888

# Install system dependencies for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, models, and datasets
COPY coach_backend.py .
COPY cricket_shot_classifier-20260420T175634Z-3-001/ ./cricket_shot_classifier-20260420T175634Z-3-001/

EXPOSE 8888

# Start FastAPI Uvicorn server
CMD ["uvicorn", "coach_backend:app", "--host", "0.0.0.0", "--port", "8888"]
