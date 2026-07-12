from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database.config import init_db
from app.routes import auth, transactions, admin
from app.ml.fraud_model import train_model
import os


@asynccontextmanager
async def lifespan(app):
    # Startup
    init_db()
    model_path = os.path.join(os.path.dirname(__file__), "fraud_model.pkl")
    if not os.path.exists(model_path):
        print("Training ML model...")
        train_model()
    print("UPI Fraud Detection System started!")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="UPI Fraud Detection System",
    description="Real-time fraud detection for UPI transactions using Rule Engine + ML",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {"message": "UPI Fraud Detection API", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
