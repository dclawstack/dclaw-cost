from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", case_sensitive=False)

    app_name: str = "DClaw Cost"
    app_env: str = "dev"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dclaw_cost"

    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60

    openrouter_api_key: str = ""
    openrouter_model: str = "moonshotai/kimi-k2"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
