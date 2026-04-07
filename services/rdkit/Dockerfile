FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libxrender1 libxext6 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir rdkit-pypi fastapi uvicorn[standard]

COPY server.py .

EXPOSE 8003

CMD ["python", "server.py"]
