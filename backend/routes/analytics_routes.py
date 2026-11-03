"""
Gradelytics - Analytics & Reports Routes
Serves statistical distributions, multi-variable correlation plots
(Attendance vs Predicted, Study Hours vs Predicted, Previous Marks vs Predicted),
and Random Forest feature importances from actual database & model artifacts.
"""

import os
import json
from flask import Blueprint, jsonify
from routes.auth_routes import token_required
from database import execute_query
from config import Config

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('', methods=['GET'])
@token_required
def get_analytics(current_user):
    user_id = current_user['id']
    
    # 1. Fetch all predictions with student info
    records = execute_query(
        """
        SELECT p.id, p.attendance, p.previous_marks, p.assignment_marks,
               p.study_hours, p.class_participation, p.internal_marks,
               p.completed_assignments, p.predicted_marks, p.performance_category,
               s.full_name AS student_name, s.student_id AS student_code
        FROM predictions p
        JOIN students s ON p.student_id = s.id
        WHERE p.user_id = %s
        ORDER BY p.id ASC
        """,
        (user_id,),
        fetch='all'
    )
    
    # 2. Performance Distribution
    category_counts = {'Excellent': 0, 'Good': 0, 'Average': 0, 'Needs Improvement': 0}
    for r in records:
        cat = r['performance_category']
        if cat in category_counts:
            category_counts[cat] += 1
            
    distribution_chart = [
        {'category': 'Excellent (80-100)', 'count': category_counts['Excellent'], 'color': '#10B981'},
        {'category': 'Good (60-79)', 'count': category_counts['Good'], 'color': '#2563EB'},
        {'category': 'Average (40-59)', 'count': category_counts['Average'], 'color': '#F59E0B'},
        {'category': 'Needs Improvement (<40)', 'count': category_counts['Needs Improvement'], 'color': '#EF4444'}
    ]
    
    # 3. Correlation Data Points for Recharts Scatter/Line
    attendance_vs_predicted = [
        {'student': r['student_name'], 'attendance': round(r['attendance'], 1), 'predicted_marks': round(r['predicted_marks'], 1)}
        for r in records
    ]
    
    study_hours_vs_predicted = [
        {'student': r['student_name'], 'study_hours': round(r['study_hours'], 1), 'predicted_marks': round(r['predicted_marks'], 1)}
        for r in records
    ]
    
    previous_vs_predicted = [
        {'student': r['student_name'], 'previous_marks': round(r['previous_marks'], 1), 'predicted_marks': round(r['predicted_marks'], 1)}
        for r in records
    ]
    
    # Summary stats
    if records:
        all_marks = [r['predicted_marks'] for r in records]
        avg_marks = round(sum(all_marks) / len(all_marks), 1)
        max_marks = round(max(all_marks), 1)
        min_marks = round(min(all_marks), 1)
    else:
        avg_marks = 0.0
        max_marks = 0.0
        min_marks = 0.0
        
    # 4. Feature Importance from saved model metadata
    base_dir = os.path.dirname(os.path.abspath(__file__))
    meta_json_path = os.path.join(base_dir, '..', 'saved_model', 'model_metrics.json')
    feature_importance_list = []
    
    if os.path.exists(meta_json_path):
        with open(meta_json_path, 'r') as f:
            meta = json.load(f)
            fi = meta.get('feature_importance', {})
            labels = meta.get('feature_labels', {})
            feature_importance_list = [
                {'feature': labels.get(k, k), 'importance': v, 'key': k}
                for k, v in sorted(fi.items(), key=lambda item: item[1], reverse=True)
            ]
            
    return jsonify({
        'success': True,
        'summary': {
            'total_evaluated': len(records),
            'average_predicted_marks': avg_marks,
            'highest_predicted_marks': max_marks,
            'lowest_predicted_marks': min_marks,
        },
        'distribution': distribution_chart,
        'attendance_vs_predicted': attendance_vs_predicted,
        'study_hours_vs_predicted': study_hours_vs_predicted,
        'previous_vs_predicted': previous_vs_predicted,
        'feature_importance': feature_importance_list
    }), 200
