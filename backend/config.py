from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    REDIS_URL: str = "redis://localhost:6379"
    STRUCTURE_CACHE: str = "/data/structures"
    P2RANK_SERVICE_URL: str = "http://p2rank:8001"
    IMMUNEBUILDER_SERVICE_URL: str = "http://immunebuilder:8002"
    RDKIT_SERVICE_URL: str = "http://rdkit:8003"
    CLAUDE_API_KEY: str = ""


settings = Settings()
