FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential curl git \
    && rm -rf /var/lib/apt/lists/*

ARG TORCH_VARIANT=cpu
RUN if [ "$TORCH_VARIANT" = "cu121" ]; then \
      pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cu121 ; \
    else \
      pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu ; \
    fi

RUN pip install --no-cache-dir \
      boltz==2.2.0 \
      fastapi \
      "uvicorn[standard]" \
      pydantic \
      pyyaml \
      redis

ENV BOLTZ_CACHE=/app/.boltz_cache
RUN mkdir -p $BOLTZ_CACHE

COPY server.py .
COPY jobs.py .

EXPOSE 8004
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8004"]
