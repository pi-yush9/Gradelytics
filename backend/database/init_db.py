"""
Gradelytics - Database Initialization Script
Executes schema creation against MySQL or initializes the local database.
"""

import sys
import os

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import init_db, check_mysql_availability
from config import Config

def main():
    print("=" * 60)
    print("Gradelytics Database Setup Utility")
    print(f"Target DB: {Config.DB_NAME} on {Config.DB_HOST}:{Config.DB_PORT}")
    print("=" * 60)
    
    mysql_live = check_mysql_availability()
    if mysql_live:
        print("[SUCCESS] MySQL server detected and responsive.")
    else:
        print("[NOTICE] MySQL server not detected. SQLite local engine will be used as fallback.")
        
    init_db()
    print("[DONE] Database tables verified and ready.")

if __name__ == '__main__':
    main()
