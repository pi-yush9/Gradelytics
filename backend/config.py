import os
from datetime import timedelta
from dotenv import load_dotenv

# Search for .env in current or root directory
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, '..', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'gradelytics-super-secret-key-bca-final-year-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'gradelytics-jwt-secret-key-academic-platform')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv('JWT_EXPIRY_HOURS', '24')))
    
    # Database Settings
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'gradelytics_db')
    DB_PORT = int(os.getenv('DB_PORT', '3306'))
    
    # SQLite Fallback Path (if MySQL server isn't running yet)
    SQLITE_PATH = os.path.join(base_dir, 'database', 'gradelytics_db.sqlite')
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000')
