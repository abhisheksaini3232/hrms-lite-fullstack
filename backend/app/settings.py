from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[1] / ".env"), extra="ignore"
    )

    mongodb_uri: str
    mongodb_db: str = "hrms_lite"
    cors_origins: str = "http://localhost:5173"

    # Auth / JWT settings
    jwt_secret: str = "change-me-in-env"  # override in .env for production
    jwt_algorithm: str = "HS256"
    jwt_access_token_exp_minutes: int = 60

    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
