from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.price_analysis import router as price_analysis_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Real Estate Analytics API",
        version="1.0.0",
        description="Provides pricing, rental yield, and investment insights for real estate listings.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(price_analysis_router)

    @app.get("/health")
    def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()


