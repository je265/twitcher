FROM python:3.11-slim

# Install FFmpeg and required packages
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY apps/python-worker/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker script
COPY apps/python-worker/worker.py .

# Run the worker
CMD ["python", "worker.py"]