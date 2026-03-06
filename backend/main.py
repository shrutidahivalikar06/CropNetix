from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
from ml.predict import predict_image
import random

app = FastAPI()

# Allow frontend (React) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for hackathon simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Folder to store uploaded images
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# -------- MODELS --------
class UserRegister(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


# -------- ROOT --------
@app.get("/")
def root():
    return {"message": "Backend is running successfully"}


# -------- AUTH ENDPOINTS (Temporary for frontend) --------
@app.post("/api/auth/register")
def register(user: UserRegister):
    return {
        "message": "User registered successfully",
        "user": user.email
    }


@app.post("/api/auth/login")
def login(user: UserLogin):
    return {
        "message": "Login successful",
        "token": "dummy_token_123"
    }


@app.post("/api/auth/logout")
def logout():
    return {"message": "Logged out successfully"}


# -------- PREDICTION --------
@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):

    # Save uploaded image
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Send image to ML model
    result = predict_image(file_path)

    return {
        "filename": file.filename,
        "severity": result["severity"],
        "recommendation": result["recommendation"],
        "confidence": result["confidence"]
    }