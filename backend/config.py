import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load environment variables from .env file
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)

# API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
JWT_SECRET = os.getenv("JWT_SECRET", "b63c784ad9a64e1c2514e82df2e6e3bb2a8b9dcde9953c07fa224fe1e8d98d24")
PORT = int(os.getenv("PORT", 5000))
FLASK_ENV = os.getenv("FLASK_ENV", "development")

# File storage configurations
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
VECTOR_STORE_DIR = os.path.join(BASE_DIR, "vector_stores")
DATABASE_PATH = os.path.join(BASE_DIR, "users.db")

# Ensure required directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(VECTOR_STORE_DIR, exist_ok=True)

print("Configuration loaded. Base Directory:", BASE_DIR)
