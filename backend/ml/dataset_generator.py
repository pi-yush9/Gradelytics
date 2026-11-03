"""
Gradelytics - Synthetic Dataset Generator
Generates realistic student performance records for machine learning model training.
Strictly documented as synthetic academic data.
Seed: 42 for full reproducibility.
"""

import numpy as np
import pandas as pd
import os

def generate_student_dataset(num_records=500, random_state=42):
    np.random.seed(random_state)
    
    # 1. Attendance Percentage (35% to 100%)
    # Skewed towards typical university attendance
    attendance = np.clip(np.random.normal(loc=76, scale=14, size=num_records), 35, 100).round(1)
    
    # 2. Previous Examination Marks (30 to 98)
    previous_marks = np.clip(np.random.normal(loc=65, scale=16, size=num_records), 30, 98).round(1)
    
    # 3. Assignment Marks (30 to 100)
    assignment_marks = np.clip(
        0.5 * previous_marks + 0.3 * (attendance / 100 * 80) + np.random.normal(15, 10, num_records),
        25, 100
    ).round(1)
    
    # 4. Daily Study Hours (0.5 to 10.0 hours)
    study_hours = np.clip(np.random.gamma(shape=3.0, scale=1.1, size=num_records), 0.5, 10.0).round(1)
    
    # 5. Class Participation (1 to 10)
    participation = np.clip(
        (attendance / 10) * 0.6 + (study_hours / 10) * 2 + np.random.normal(1.5, 1.2, num_records),
        1, 10
    ).round(1)
    
    # 6. Internal Assessment Marks (25 to 100)
    internal_marks = np.clip(
        0.4 * previous_marks + 0.3 * assignment_marks + 1.5 * study_hours + np.random.normal(5, 7, num_records),
        20, 100
    ).round(1)
    
    # 7. Completed Assignments (0 to 12 assignments)
    completed_assignments = np.clip(
        np.round((assignment_marks / 100) * 12 + np.random.normal(0, 1, num_records)),
        0, 12
    ).astype(int)
    
    # Target Variable: Final Examination Marks (0 to 100)
    # Regression target synthesized using pedagogical weights + realistic variance
    base_score = (
        0.28 * internal_marks +
        0.26 * previous_marks +
        0.18 * assignment_marks +
        0.14 * attendance +
        1.6 * study_hours +
        0.9 * participation +
        0.6 * completed_assignments
    )
    
    # Add natural real-world variation (unmeasured factors: exam anxiety, health, paper difficulty)
    noise = np.random.normal(loc=-10.0, scale=4.5, size=num_records)
    final_exam_marks = np.clip(base_score + noise, 18, 99).round(1)
    
    df = pd.DataFrame({
        'attendance': attendance,
        'previous_marks': previous_marks,
        'assignment_marks': assignment_marks,
        'study_hours': study_hours,
        'class_participation': participation,
        'internal_marks': internal_marks,
        'completed_assignments': completed_assignments,
        'final_exam_marks': final_exam_marks
    })
    
    return df

if __name__ == '__main__':
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'database')
    os.makedirs(data_dir, exist_ok=True)
    csv_path = os.path.join(data_dir, 'student_performance_dataset.csv')
    
    df = generate_student_dataset(num_records=500, random_state=42)
    df.to_csv(csv_path, index=False)
    print(f"[DATASET] Generated {len(df)} synthetic student records at {csv_path}")
    print(df.describe())
