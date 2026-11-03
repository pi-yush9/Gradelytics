"""
Gradelytics - Database Connection & Management Layer
Primary Database: MySQL (PyMySQL)
Graceful Fallback: Local SQLite engine if MySQL server is not active on host.
Maintains identical schema, tables, and dictionary cursor interfaces.
"""

import os
import sqlite3
import pymysql
from pymysql.cursors import DictCursor
from config import Config

_USE_SQLITE = False
_DB_INITIALIZED = False

def check_mysql_availability():
    """
    Checks if MySQL is reachable on the configured host & port.
    """
    try:
        conn = pymysql.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            port=Config.DB_PORT,
            connect_timeout=2
        )
        conn.close()
        return True
    except Exception as e:
        return False

def get_db_connection():
    """
    Returns an active database connection with dictionary cursor semantics.
    """
    global _USE_SQLITE
    
    if not _USE_SQLITE:
        try:
            conn = pymysql.connect(
                host=Config.DB_HOST,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
                port=Config.DB_PORT,
                cursorclass=DictCursor,
                autocommit=True
            )
            return conn, 'mysql'
        except Exception:
            _USE_SQLITE = True
            
    # SQLite fallback
    os.makedirs(os.path.dirname(Config.SQLITE_PATH), exist_ok=True)
    conn = sqlite3.connect(Config.SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn, 'sqlite'

def init_db():
    """
    Initializes tables and schema.
    """
    global _USE_SQLITE, _DB_INITIALIZED
    if _DB_INITIALIZED:
        return
        
    mysql_online = check_mysql_availability()
    if mysql_online:
        try:
            # Connect to MySQL server root and ensure database exists
            root_conn = pymysql.connect(
                host=Config.DB_HOST,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                port=Config.DB_PORT,
                autocommit=True
            )
            with root_conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.DB_NAME}` CHARACTER SET utf8mb4;")
            root_conn.close()
            
            # Connect to gradelytics_db and create tables
            conn, engine = get_db_connection()
            with conn.cursor() as cursor:
                # 1. users
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        full_name VARCHAR(150) NOT NULL,
                        email VARCHAR(150) NOT NULL UNIQUE,
                        password_hash VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_user_email (email)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                # 2. students
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS students (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        student_id VARCHAR(50) NOT NULL UNIQUE,
                        full_name VARCHAR(150) NOT NULL,
                        email VARCHAR(150) NOT NULL,
                        course VARCHAR(100) NOT NULL,
                        semester INT NOT NULL,
                        attendance FLOAT NOT NULL DEFAULT 0.0,
                        previous_marks FLOAT NOT NULL DEFAULT 0.0,
                        created_by INT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
                        INDEX idx_student_id (student_id),
                        INDEX idx_student_creator (created_by)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                # 3. predictions
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS predictions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        student_id INT NOT NULL,
                        user_id INT NOT NULL,
                        attendance FLOAT NOT NULL,
                        previous_marks FLOAT NOT NULL,
                        assignment_marks FLOAT NOT NULL,
                        study_hours FLOAT NOT NULL,
                        class_participation FLOAT NOT NULL,
                        internal_marks FLOAT NOT NULL,
                        completed_assignments INT NOT NULL,
                        predicted_marks FLOAT NOT NULL,
                        performance_category VARCHAR(50) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        INDEX idx_prediction_student (student_id),
                        INDEX idx_prediction_user (user_id),
                        INDEX idx_prediction_category (performance_category)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
            conn.close()
            print("[DATABASE] Successfully connected to MySQL server and verified 'gradelytics_db' tables.")
            _USE_SQLITE = False
            _DB_INITIALIZED = True
            return
        except Exception as e:
            print(f"[DATABASE] MySQL init failed ({e}). Falling back to local database engine.")
            _USE_SQLITE = True

    # Fallback to SQLite with exact schema
    _USE_SQLITE = True
    os.makedirs(os.path.dirname(Config.SQLITE_PATH), exist_ok=True)
    conn = sqlite3.connect(Config.SQLITE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            course TEXT NOT NULL,
            semester INTEGER NOT NULL,
            attendance REAL NOT NULL DEFAULT 0.0,
            previous_marks REAL NOT NULL DEFAULT 0.0,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            attendance REAL NOT NULL,
            previous_marks REAL NOT NULL,
            assignment_marks REAL NOT NULL,
            study_hours REAL NOT NULL,
            class_participation REAL NOT NULL,
            internal_marks REAL NOT NULL,
            completed_assignments INTEGER NOT NULL,
            predicted_marks REAL NOT NULL,
            performance_category TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)
    conn.commit()
    conn.close()
    _DB_INITIALIZED = True
    print(f"[DATABASE] Local database initialized at: {Config.SQLITE_PATH}")

def execute_query(sql, params=None, fetch=None, last_id=False):
    """
    Executes a SQL query seamlessly across MySQL and SQLite.
    Automatically translates '%s' placeholders to '?' when running in SQLite mode.
    Always returns dict or list of dicts.
    """
    init_db()
    conn, engine = get_db_connection()
    
    try:
        if engine == 'mysql':
            with conn.cursor() as cursor:
                cursor.execute(sql, params or ())
                if last_id:
                    result = cursor.lastrowid
                elif fetch == 'one':
                    result = cursor.fetchone()
                elif fetch == 'all':
                    result = cursor.fetchall()
                else:
                    result = cursor.rowcount
            conn.close()
            return result
        else:
            # SQLite conversion
            sqlite_sql = sql.replace('%s', '?')
            cursor = conn.cursor()
            cursor.execute(sqlite_sql, params or ())
            
            if last_id:
                result = cursor.lastrowid
                conn.commit()
            elif fetch == 'one':
                row = cursor.fetchone()
                result = dict(row) if row else None
            elif fetch == 'all':
                rows = cursor.fetchall()
                result = [dict(r) for r in rows]
            else:
                conn.commit()
                result = cursor.rowcount
            conn.close()
            return result
    except Exception as e:
        if conn:
            conn.close()
        raise e
