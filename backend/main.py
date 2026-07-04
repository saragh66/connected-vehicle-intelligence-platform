from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from backend.config.settings import get_settings
from backend.config.logging import configure_logging

configure_logging()
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    yield
    # --- Shutdown ---
    logger.info("🛑 Shutting down application")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="Real-Time Vehicle Telemetry Platform using Kafka, PostgreSQL and RAG",
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled error on {request.url.path}: {exc}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Internal server error"},
        )

    @app.get("/", tags=["Health"])
    def root():
        return {
            "status": "running",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }

    @app.get("/health", tags=["Health"])
    def health_check():
        return {"status": "healthy"}

    return app


app = create_app()