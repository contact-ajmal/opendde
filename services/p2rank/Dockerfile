FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl python3 python3-pip && \
    rm -rf /var/lib/apt/lists/* && \
    curl -L https://github.com/rdk/p2rank/releases/download/2.5.1/p2rank_2.5.1.tar.gz | tar xz && \
    mv p2rank_2.5.1 p2rank
RUN pip3 install fastapi 'uvicorn[standard]'
COPY server.py .
EXPOSE 8001
CMD ["python3", "server.py"]
