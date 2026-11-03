"""
Gradelytics - Dashboard Routes
Provides aggregated statistics, real-time database-driven metric cards,
marks distribution, recent predictions, and low-performance risk alerts.
"""

from flask import Blueprint, jsonify
from routes.auth_routes import token_required
from database import execute_query

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('', methods=['GET'])
@token_required
def get_dashboard_data(current_user):
    user_id = current_user['id']
    
    # 1. Total Students
    student_count_row = execute_query(
        "SELECT COUNT(*) AS total FROM students WHERE created_by = %s",
        (user_id,),
        fetch='one'
    )
    total_students = student_count_row['total'] if student_count_row else 0
    
    # 2. Total Predictions
    pred_count_row = execute_query(
        "SELECT COUNT(*) AS total FROM predictions WHERE user_id = %s",
        (user_id,),
        fetch='one'
    )
    total_predictions = pred_count_row['total'] if pred_count_row else 0
    
    # 3. Average Predicted Marks
    avg_marks_row = execute_query(
        "SELECT AVG(predicted_marks) AS avg_marks FROM predictions WHERE user_id = %s",
        (user_id,),
        fetch='one'
    )
    avg_predicted_marks = round(float(avg_marks_row['avg_marks']), 1) if (avg_marks_row and avg_marks_row['avg_marks'] is not None) else 0.0
    
    # 4. Students At Risk (Predicted Marks < 40 or 'Needs Improvement')
    risk_row = execute_query(
        """
        SELECT COUNT(DISTINCT student_id) AS total_at_risk
        FROM predictions
        WHERE user_id = %s AND (predicted_marks < 40.0 OR performance_category = 'Needs Improvement')
        """,
        (user_id,),
        fetch='one'
    )
    students_at_risk = risk_row['total_at_risk'] if risk_row else 0
    
    # 5. Category Distribution
    distribution_rows = execute_query(
        """
        SELECT performance_category, COUNT(*) AS count
        FROM predictions
        WHERE user_id = %s
        GROUP BY performance_category
        """,
        (user_id,),
        fetch='all'
    )
    
    categories_template = {
        'Excellent': 0,
        'Good': 0,
        'Average': 0,
        'Needs Improvement': 0
    }
    for r in distribution_rows:
        cat = r['performance_category']
        if cat in categories_template:
            categories_template[cat] = r['count']
            
    distribution_list = [
        {'name': 'Excellent (80-100)', 'category': 'Excellent', 'count': categories_template['Excellent'], 'color': '#10B981'},
        {'name': 'Good (60-79)', 'category': 'Good', 'count': categories_template['Good'], 'color': '#2563EB'},
        {'name': 'Average (40-59)', 'category': 'Average', 'count': categories_template['Average'], 'color': '#F59E0B'},
        {'name': 'Needs Improvement (<40)', 'category': 'Needs Improvement', 'count': categories_template['Needs Improvement'], 'color': '#EF4444'}
    ]
    
    # 6. Recent Predictions (last 5)
    recent_predictions = execute_query(
        """
        SELECT p.id, p.student_id, p.predicted_marks, p.performance_category, p.created_at,
               s.full_name AS student_name, s.student_id AS student_code, s.course, s.semester
        FROM predictions p
        JOIN students s ON p.student_id = s.id
        WHERE p.user_id = %s
        ORDER BY p.created_at DESC
        LIMIT 6
        """,
        (user_id,),
        fetch='all'
    )
    
    # 7. Low Performance Alerts (Students predicted < 40 or attendance < 65)
    low_performance_alerts = execute_query(
        """
        SELECT DISTINCT s.id, s.student_id, s.full_name, s.attendance, s.previous_marks,
               p.predicted_marks, p.performance_category, p.created_at AS prediction_date
        FROM students s
        LEFT JOIN predictions p ON s.id = p.student_id
        WHERE s.created_by = %s AND (s.attendance < 65 OR p.predicted_marks < 40.0)
        ORDER BY s.attendance ASC, p.predicted_marks ASC
        LIMIT 5
        """,
        (user_id,),
        fetch='all'
    )
    
    return jsonify({
        'success': True,
        'statistics': {
            'total_students': total_students,
            'total_predictions': total_predictions,
            'avg_predicted_marks': avg_predicted_marks,
            'students_at_risk': students_at_risk
        },
        'distribution': distribution_list,
        'recent_predictions': recent_predictions,
        'low_performance_alerts': low_performance_alerts
    }), 200
