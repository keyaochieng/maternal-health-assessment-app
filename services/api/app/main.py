from fastapi import FastAPI

app = FastAPI(
    title="Intellisoft Patient Assessment API",
    version="0.1.0",
    description="API for patient registration, vitals, and assessments.",
)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Confirm that the API process is responding."""
    return {"status": "ok"}