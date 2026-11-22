from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine

app = FastAPI(
    title="Intellisoft Patient Assessment API",
    version="0.1.0",
    description="API for patient registration, vitals, and assessments.",
)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Check that both the API and its PostgreSQL database are responding."""
    try:
        # A tiny query confirms that the API can reach and use the database.
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as error:
        # Return a clear service error if PostgreSQL is stopped or unreachable.
        raise HTTPException(
            status_code=503,
            detail="Database connection is unavailable.",
        ) from error

    return {"status": "ok", "database": "connected"}