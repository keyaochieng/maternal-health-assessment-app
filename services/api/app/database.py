import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Load settings from services/api/.env when the API starts locally.
load_dotenv()

# Read the connection address from the environment so it can change per setup.
database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise RuntimeError(
        "DATABASE_URL is missing. Add it to services/api/.env before starting the API."
    )

# The engine manages the actual connections between Python and PostgreSQL.
engine = create_engine(database_url, echo=False)

# Allows for short-lived conversations with the database, used for queries and updates.
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    # Database table models will inherit from this shared base in the next step.
    pass