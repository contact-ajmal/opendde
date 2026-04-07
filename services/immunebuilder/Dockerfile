FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential hmmer && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir ANARCI openmm pdbfixer ImmuneBuilder fastapi uvicorn[standard]
COPY server.py .
EXPOSE 8002
CMD ["python", "server.py"]
