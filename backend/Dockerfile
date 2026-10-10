# Lightweight Python 3.11/3.12 production container
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source tree
COPY backend/app ./app
COPY backend/scripts ./scripts
COPY data ./data
COPY models ./models

# Train model if not present
RUN python scripts/train_model.py

# Expose FastAPI port
EXPOSE 8000

# Set environment defaults
ENV PORT=8000
ENV HOST=0.0.0.0
ENV ENVIRONMENT=production

# Run FastAPI via Uvicorn
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
