import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session
from typing import Generator
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment variable or use SQLite as fallback
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///cre_platform.db")

# Create SQLAlchemy engine with appropriate configuration
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # SQLite-specific configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL or other database configuration
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Database dependency
def get_db() -> Generator[Session, None, None]:
    """
    Get a database session

    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
