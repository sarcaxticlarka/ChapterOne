import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load from the parent directory .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

class Settings(BaseSettings):
    # Support lowercase and uppercase env variables
    groq_api: str = os.getenv("groq_api") or os.getenv("GROQ_API_KEY", "")
    neon_db: str = os.getenv("neon_db") or os.getenv("DATABASE_URL", "")
    
    # JWT authentication settings
    jwt_secret: str = os.getenv("JWT_SECRET", "supersecretjwtkey_change_me_in_production")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day session
    
    # Google OAuth settings (to be added later)
    google_client_id: str = os.getenv("google_client_ID") or os.getenv("google_client_id") or os.getenv("GOOGLE_CLIENT_ID", "")
    
    # Upload folder
    upload_dir: str = os.path.join(os.path.dirname(__file__), "uploads")
    
    class Config:
        case_sensitive = False

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.upload_dir, exist_ok=True)
