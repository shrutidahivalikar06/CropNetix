from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
from ml.predict import predict_image
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# expose images to frontend
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")


class UserRegister(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


@app.get("/")
def root():
    return {"message": "Backend is running successfully"}


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

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = predict_image(file_path)

    # fix windows path slashes
    original = result["images"]["original"].replace("\\", "/")
    heatmap = result["images"]["heatmap"].replace("\\", "/")
    mask = result["images"]["mask"].replace("\\", "/")
    boundary = result["images"]["boundary"].replace("\\", "/")

    return {
        "filename": file.filename,
        "severity": result["severity"],
        "recommendation": result["recommendation"],
        "confidence": result["confidence"],
        "lodged_area_percent": result["lodged_area_percent"],
        "lodging_patches": result["lodging_patches"],
        "raw_score": result["raw_score"],
        "method": result["method"],
        "threshold": result["threshold"],

        "images": {
            "original": f"http://127.0.0.1:8000/{original}",
            "heatmap": f"http://127.0.0.1:8000/{heatmap}",
            "mask": f"http://127.0.0.1:8000/{mask}",
            "boundary": f"http://127.0.0.1:8000/{boundary}"
        }
    }