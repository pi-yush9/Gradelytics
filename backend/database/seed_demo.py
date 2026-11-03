"""
Gradelytics - Seed Demo Data Script
Populates default demonstration educator, students, and predictions.
"""

import sys
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from werkzeug.security import generate_password_hash
from database import execute_query, init_db
from ml.predict import predict_student_performance

def seed_demo_data():
    init_db()
    
    # 1. Check or create demo user
    demo_email = "educator@gradelytics.com"
    existing_user = execute_query("SELECT id FROM users WHERE email = %s", (demo_email,), fetch='one')
    
    if not existing_user:
        user_id = execute_query(
            "INSERT INTO users (full_name, email, password_hash) VALUES (%s, %s, %s)",
            ("Dr. Sarah Williams", demo_email, generate_password_hash("admin123")),
            last_id=True
        )
        print(f"[SEED] Created demo educator account: {demo_email} (Password: admin123)")
    else:
        user_id = existing_user['id']
        print(f"[SEED] Using existing demo user ID: {user_id}")
        
    # 2. Sample students
    students_data = [
        ("BCA-2024-001", "Aarav Sharma", "aarav.s@gradelytics.edu", "BCA", 5, 88.5, 84.0),
        ("BCA-2024-002", "Priya Patel", "priya.p@gradelytics.edu", "BCA", 5, 94.0, 91.0),
        ("BCA-2024-003", "Rohan Verma", "rohan.v@gradelytics.edu", "BCA", 5, 62.0, 48.0),
        ("BCA-2024-004", "Ananya Iyer", "ananya.i@gradelytics.edu", "BCA", 5, 78.5, 74.0),
        ("BCA-2024-005", "Vikram Singh", "vikram.s@gradelytics.edu", "BCA", 5, 42.0, 36.0),
        ("BCA-2024-006", "Neha Gupta", "neha.g@gradelytics.edu", "BCA", 5, 81.0, 76.5),
        ("BCA-2024-007", "Aditya Roy", "aditya.r@gradelytics.edu", "BCA", 5, 55.0, 42.0),
        ("BCA-2024-008", "Sneha Kulkarni", "sneha.k@gradelytics.edu", "BCA", 5, 96.0, 93.0)
    ]
    
    student_records = []
    for code, name, email, course, sem, att, prev in students_data:
        existing_stu = execute_query("SELECT id FROM students WHERE student_id = %s", (code,), fetch='one')
        if not existing_stu:
            s_id = execute_query(
                """
                INSERT INTO students (student_id, full_name, email, course, semester, attendance, previous_marks, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (code, name, email, course, sem, att, prev, user_id),
                last_id=True
            )
            student_records.append((s_id, att, prev))
        else:
            student_records.append((existing_stu['id'], att, prev))
            
    # 3. Create initial predictions for each student
    pred_count = execute_query("SELECT COUNT(*) as cnt FROM predictions WHERE user_id = %s", (user_id,), fetch='one')['cnt']
    if pred_count == 0:
        for s_id, att, prev in student_records:
            assign = round(prev * 0.95 + (att / 100) * 5, 1)
            study = round((att / 20) * 0.8 + 1.2, 1)
            part = round(min(10, max(2, (att / 10) * 0.9)), 1)
            intern = round(prev * 0.9 + (att / 100) * 8, 1)
            comp = int(min(12, max(3, round((assign / 100) * 12))))
            
            features = {
                'attendance': att,
                'previous_marks': prev,
                'assignment_marks': assign,
                'study_hours': study,
                'class_participation': part,
                'internal_marks': intern,
                'completed_assignments': comp
            }
            res = predict_student_performance(features)
            
            execute_query(
                """
                INSERT INTO predictions (
                    student_id, user_id, attendance, previous_marks, assignment_marks,
                    study_hours, class_participation, internal_marks, completed_assignments,
                    predicted_marks, performance_category
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    s_id, user_id, att, prev, assign,
                    study, part, intern, comp,
                    res['predicted_marks'], res['performance_category']
                )
            )
        print(f"[SEED] Inserted baseline predictions for {len(student_records)} students.")
    print("[SEED] Seeding completed.")

if __name__ == '__main__':
    seed_demo_data()
