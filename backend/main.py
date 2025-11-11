from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.price_analysis import router as price_analysis_router


def create_app() -> FastAPI:
    load_dotenv()
    app = FastAPI(title="Real Estate Analytics API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(price_analysis_router, prefix="/api")

    return app


app = create_app()

