from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.config import settings

# Create SQLAlchemy engine
engine = create_engine(settings.neon_db, pool_pre_ping=True)

# Create SessionLocal class for DB sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base
Base = declarative_base()

# DB Dependency helper
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
