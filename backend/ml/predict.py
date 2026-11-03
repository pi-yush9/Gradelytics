"""
Gradelytics - Prediction Engine
Loads the trained ML regression model and provides real-time examination marks prediction,
performance categorization, personalized recommendations, and input validation.
"""

import sys
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import joblib
import numpy as np
import pandas as pd

FEATURE_NAMES = [
    'attendance',
    'previous_marks',
    'assignment_marks',
    'study_hours',
    'class_participation',
    'internal_marks',
    'completed_assignments'
]

# Cached model & metadata
_MODEL = None
_METADATA = None

def get_model_and_metadata():
    global _MODEL, _METADATA
    if _MODEL is None or _METADATA is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, '..', 'saved_model', 'student_model.joblib')
        meta_path = os.path.join(base_dir, '..', 'saved_model', 'model_metrics.joblib')
        
        if not os.path.exists(model_path) or not os.path.exists(meta_path):
            # If not yet trained, trigger training
            from ml.train_model import train_and_evaluate
            train_and_evaluate()
            
        _MODEL = joblib.load(model_path)
        _METADATA = joblib.load(meta_path)
    return _MODEL, _METADATA

def get_performance_category(marks):
    """
    Performance Categories:
    80–100: Excellent
    60–79:  Good
    40–59:  Average
    Below 40: Needs Improvement
    """
    if marks >= 80.0:
        return {
            "name": "Excellent",
            "badge_color": "emerald",
            "status": "Safe",
            "description": "Outstanding academic standing. On track for academic honors or distinction."
        }
    elif marks >= 60.0:
        return {
            "name": "Good",
            "badge_color": "blue",
            "status": "Safe",
            "description": "Consistent performance. Demonstrates solid understanding of course material."
        }
    elif marks >= 40.0:
        return {
            "name": "Average",
            "badge_color": "amber",
            "status": "Moderate Risk",
            "description": "Meeting minimum passing standards. High potential to climb to Good with targeted effort."
        }
    else:
        return {
            "name": "Needs Improvement",
            "badge_color": "rose",
            "status": "At Risk",
            "description": "Academic risk alert. Requires immediate intervention and structured study planning."
        }

def generate_recommendations(inputs, predicted_marks):
    """
    Generate personalized recommendations strictly based on actual input values.
    """
    recs = []
    
    # 1. Attendance check
    att = inputs.get('attendance', 0)
    if att < 75:
        recs.append({
            "category": "Attendance & Regularity",
            "severity": "high" if att < 65 else "medium",
            "recommendation": f"Current attendance is {att:.1f}%, which is below the recommended 75% threshold. Increasing classroom attendance will directly reinforce core concepts and ensure eligibility for exams."
        })
    elif att >= 90:
        recs.append({
            "category": "Attendance & Regularity",
            "severity": "low",
            "recommendation": f"Exemplary attendance ({att:.1f}%). Maintain this consistency through the semester final stretch."
        })
        
    # 2. Daily Study Hours
    hrs = inputs.get('study_hours', 0)
    if hrs < 2.5:
        recs.append({
            "category": "Self-Study Routine",
            "severity": "high",
            "recommendation": f"Daily study time of {hrs:.1f} hours is insufficient for thorough syllabus coverage. Aim for at least 3.5 to 4.5 dedicated hours of daily revision."
        })
    elif hrs >= 5.0:
        recs.append({
            "category": "Self-Study Routine",
            "severity": "low",
            "recommendation": f"Commendable study dedication ({hrs:.1f} hrs/day). Ensure periodic rest breaks and active recall to prevent burnout."
        })
        
    # 3. Internal Assessment Marks
    internal = inputs.get('internal_marks', 0)
    if internal < 50:
        recs.append({
            "category": "Internal Assessments",
            "severity": "high",
            "recommendation": f"Internal assessment score is {internal:.1f}/100. Meet with course instructors to review mid-term weaknesses and attend remedial/tutorial sessions."
        })
        
    # 4. Assignments & Submission
    assignments = inputs.get('assignment_marks', 0)
    completed = inputs.get('completed_assignments', 0)
    if assignments < 60 or completed < 6:
        recs.append({
            "category": "Assignment Submissions",
            "severity": "medium",
            "recommendation": f"Assignment score is {assignments:.1f}/100 with {completed} assignments submitted. Prioritize upcoming coursework deadlines to secure continuous evaluation marks."
        })
        
    # 5. Class Participation
    participation = inputs.get('class_participation', 0)
    if participation < 5:
        recs.append({
            "category": "Classroom Engagement",
            "severity": "medium",
            "recommendation": f"Class participation level is {participation:.1f}/10. Actively ask questions and engage in group problem-solving to deepen conceptual retention."
        })
        
    # 6. Overall Target Strategy
    if predicted_marks < 40:
        recs.append({
            "category": "Urgent Academic Action",
            "severity": "high",
            "recommendation": "Student is currently classified as At Risk (<40 marks). Schedule an academic advising session and establish a weekly monitored progress checklist."
        })
    elif predicted_marks >= 80:
        recs.append({
            "category": "Excellence Strategy",
            "severity": "low",
            "recommendation": "Projected in the Excellent band. Solve previous university question papers under timed examination conditions to secure top ranking."
        })
        
    if not recs:
        recs.append({
            "category": "General Academic Advice",
            "severity": "medium",
            "recommendation": "Maintain balanced performance across internal tests, regular homework, and active lecture attendance."
        })
        
    return recs

def predict_student_performance(features_dict):
    """
    Input: dictionary containing the 7 input features.
    Returns: full prediction response object.
    """
    model, metadata = get_model_and_metadata()
    
    # Ensure strict feature order
    row_values = []
    cleaned_features = {}
    for f in FEATURE_NAMES:
        val = float(features_dict.get(f, 0))
        cleaned_features[f] = val
        row_values.append(val)
        
    df_input = pd.DataFrame([cleaned_features], columns=FEATURE_NAMES)
    
    # Predict
    raw_pred = float(model.predict(df_input)[0])
    # Bound between realistic 0 and 100
    predicted_marks = round(float(np.clip(raw_pred, 0.0, 100.0)), 1)
    
    cat = get_performance_category(predicted_marks)
    recommendations = generate_recommendations(cleaned_features, predicted_marks)
    
    # Feature importance from metadata
    feature_importance = metadata.get('feature_importance', {})
    
    return {
        "predicted_marks": predicted_marks,
        "performance_category": cat["name"],
        "category_badge_color": cat["badge_color"],
        "risk_status": cat["status"],
        "category_description": cat["description"],
        "input_features": cleaned_features,
        "recommendations": recommendations,
        "feature_importance": feature_importance,
        "model_used": metadata.get('selected_model', {}).get('name', 'Random Forest Regressor'),
        "model_metrics": metadata.get('selected_model', {}).get('metrics', {}),
        "disclaimer": "Predictions are estimates generated by a Machine Learning model. Actual examination results may vary and are not guaranteed."
    }
