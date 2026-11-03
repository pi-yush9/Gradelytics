"""
Gradelytics - Machine Learning Model Training Pipeline
Compares Linear Regression and Random Forest Regressor on student performance data.
Evaluates using genuine regression metrics: MAE, RMSE, R² Score.
Saves the superior model and evaluation metadata.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

# Ensure reproducible generation
from dataset_generator import generate_student_dataset

FEATURE_NAMES = [
    'attendance',
    'previous_marks',
    'assignment_marks',
    'study_hours',
    'class_participation',
    'internal_marks',
    'completed_assignments'
]
TARGET_NAME = 'final_exam_marks'

def train_and_evaluate():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    saved_model_dir = os.path.join(base_dir, '..', 'saved_model')
    database_dir = os.path.join(base_dir, '..', 'database')
    os.makedirs(saved_model_dir, exist_ok=True)
    os.makedirs(database_dir, exist_ok=True)
    
    # 1. Dataset Generation & Loading
    csv_path = os.path.join(database_dir, 'student_performance_dataset.csv')
    df = generate_student_dataset(num_records=500, random_state=42)
    df.to_csv(csv_path, index=False)
    print(f"[1] Dataset generated: {len(df)} records. Saved to {csv_path}")
    
    # 2. Data Cleaning & Validation
    missing_count = df.isnull().sum().sum()
    duplicate_count = df.duplicated().sum()
    print(f"[2] Data Cleaning: Missing values={missing_count}, Duplicates={duplicate_count}")
    
    # 3. Train/Test Split (80% train, 20% test)
    X = df[FEATURE_NAMES]
    y = df[TARGET_NAME]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"[3] Train split: {len(X_train)} samples, Test split: {len(X_test)} samples")
    
    # 4. Train Linear Regression
    lr_model = LinearRegression()
    lr_model.fit(X_train, y_train)
    lr_preds = lr_model.predict(X_test)
    
    lr_mae = mean_absolute_error(y_test, lr_preds)
    lr_rmse = root_mean_squared_error(y_test, lr_preds)
    lr_r2 = r2_score(y_test, lr_preds)
    
    print("\n--- Model 1: Linear Regression ---")
    print(f"MAE:  {lr_mae:.3f}")
    print(f"RMSE: {lr_rmse:.3f}")
    print(f"R²:   {lr_r2:.3f}")
    
    # 5. Train Random Forest Regressor
    rf_model = RandomForestRegressor(
        n_estimators=120,
        max_depth=8,
        min_samples_split=4,
        random_state=42
    )
    rf_model.fit(X_train, y_train)
    rf_preds = rf_model.predict(X_test)
    
    rf_mae = mean_absolute_error(y_test, rf_preds)
    rf_rmse = root_mean_squared_error(y_test, rf_preds)
    rf_r2 = r2_score(y_test, rf_preds)
    
    print("\n--- Model 2: Random Forest Regressor ---")
    print(f"MAE:  {rf_mae:.3f}")
    print(f"RMSE: {rf_rmse:.3f}")
    print(f"R²:   {rf_r2:.3f}")
    
    # 6. Model Selection
    if rf_r2 >= lr_r2:
        selected_model_name = "Random Forest Regressor"
        selected_model = rf_model
        selected_metrics = {"mae": round(rf_mae, 3), "rmse": round(rf_rmse, 3), "r2": round(rf_r2, 3)}
    else:
        selected_model_name = "Linear Regression"
        selected_model = lr_model
        selected_metrics = {"mae": round(lr_mae, 3), "rmse": round(lr_rmse, 3), "r2": round(lr_r2, 3)}
    
    print(f"\n[WINNER] Selected Model: {selected_model_name}")
    
    # Feature importances from Random Forest (normalized percentages)
    importances = rf_model.feature_importances_
    feature_importance_dict = {
        name: round(float(imp) * 100, 2)
        for name, imp in zip(FEATURE_NAMES, importances)
    }
    
    metadata = {
        "dataset": {
            "total_records": len(df),
            "train_records": len(X_train),
            "test_records": len(X_test),
            "features_count": len(FEATURE_NAMES),
            "target": TARGET_NAME,
            "type": "Synthetic Academic Performance Dataset (Documented, Seed 42)"
        },
        "features": FEATURE_NAMES,
        "feature_labels": {
            "attendance": "Attendance Percentage (%)",
            "previous_marks": "Previous Examination Marks",
            "assignment_marks": "Assignment Marks",
            "study_hours": "Daily Study Hours",
            "class_participation": "Class Participation (1-10)",
            "internal_marks": "Internal Assessment Marks",
            "completed_assignments": "Completed Assignments"
        },
        "algorithms": {
            "linear_regression": {
                "name": "Linear Regression",
                "mae": round(lr_mae, 3),
                "rmse": round(lr_rmse, 3),
                "r2_score": round(lr_r2, 3),
                "coefficients": {k: round(float(v), 3) for k, v in zip(FEATURE_NAMES, lr_model.coef_)}
            },
            "random_forest": {
                "name": "Random Forest Regressor",
                "mae": round(rf_mae, 3),
                "rmse": round(rf_rmse, 3),
                "r2_score": round(rf_r2, 3),
                "n_estimators": 120,
                "max_depth": 8
            }
        },
        "selected_model": {
            "name": selected_model_name,
            "metrics": selected_metrics
        },
        "feature_importance": feature_importance_dict,
        "interpretability_note": (
            "Feature importance indicates mathematical associations learned by the Random Forest "
            "decision trees on this dataset. It describes predictive weight, NOT strict causality. "
            "Final examination marks are never used as an input feature, preventing target leakage."
        ),
        "viva_explanation": {
            "overview": "The system uses regression to predict a continuous target variable (Final Exam Marks 0-100).",
            "why_regression": "Marks are numeric and continuous. Classification predicts categories, whereas regression estimates exact marks.",
            "metrics_distinction": "MAE measures average magnitude of absolute errors in marks. RMSE penalizes larger prediction errors. R² indicates the proportion of variance in marks explained by student features.",
            "leakage_prevention": "Final exam mark is strictly the target 'y' and is excluded from input feature vector 'X'."
        }
    }
    
    # 7. Save Model & Metadata
    model_save_path = os.path.join(saved_model_dir, 'student_model.joblib')
    metadata_joblib_path = os.path.join(saved_model_dir, 'model_metrics.joblib')
    metadata_json_path = os.path.join(saved_model_dir, 'model_metrics.json')
    
    joblib.dump(selected_model, model_save_path)
    joblib.dump(metadata, metadata_joblib_path)
    with open(metadata_json_path, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print(f"[4] Model saved to: {model_save_path}")
    print(f"[5] Metadata saved to: {metadata_json_path}")
    return metadata

if __name__ == '__main__':
    train_and_evaluate()
