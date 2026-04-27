from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://opendde:opendde@localhost:5432/opendde"
    REDIS_URL: str = "redis://localhost:6379"
    STRUCTURE_CACHE: str = "/data/structures"
    P2RANK_SERVICE_URL: str = "http://p2rank:8001"
    IMMUNEBUILDER_SERVICE_URL: str = "http://immunebuilder:8002"
    RDKIT_SERVICE_URL: str = "http://rdkit:8003"
    BOLTZ_SERVICE_URL: str = "http://boltz:8004"
    CLAUDE_API_KEY: str = ""


settings = Settings()
