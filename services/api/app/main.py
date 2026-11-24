from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import Base, engine
from app.routers import assessments, patients, vitals

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # I create the starter tables when the API starts.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Intellisoft Patient Assessment API",
    version="0.1.0",
    description="API for patient registration, vitals, assessments, and maternal risk classification.",
    lifespan=lifespan,
)

app.include_router(patients.router)
app.include_router(vitals.router)
app.include_router(assessments.router)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Confirm that the API and its PostgreSQL database are responding."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=503,
            detail="Database connection is unavailable.",
        ) from error

    return {"status": "ok", "database": "connected"}