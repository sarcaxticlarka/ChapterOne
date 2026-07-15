import sys
import os

# Add parent directory to path so we can import backend packages
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, Base
# Import all models to ensure they register on Base
from backend import models

def init_db():
    print("Enabling vector extension on PostgreSQL...")
    with engine.begin() as conn:
        import sqlalchemy
        conn.execute(sqlalchemy.text("CREATE EXTENSION IF NOT EXISTS vector;"))
    
    print("Dropping existing tables to start clean...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables from SQLAlchemy models...")
    Base.metadata.create_all(bind=engine)
    print("SUCCESS: Neon PostgreSQL database initialized with pgvector successfully.")

if __name__ == "__main__":
    init_db()
