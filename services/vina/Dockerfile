FROM mambaorg/micromamba:1.4.9

# Switch to root to install packages or use micromamba
USER root
RUN apt-get update && apt-get install -y --no-install-recommends openbabel procps && rm -rf /var/lib/apt/lists/*
USER mambauser

WORKDIR /app

# We skip requirements.txt and just use micromamba to solve dependencies
RUN micromamba install -y -n base -c conda-forge \
    python=3.10 \
    fastapi \
    uvicorn \
    pydantic \
    vina \
    rdkit \
    && micromamba clean --all --yes

# Meeko might not be on conda-forge or might be outdated, pip install it
RUN /opt/conda/bin/pip install meeko==0.5.0

COPY --chown=mambauser:mambauser . .

EXPOSE 8004

CMD ["/opt/conda/bin/uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8004"]
