"""
Gradelytics - Marks Prediction & History Routes
Accepts student academic parameters, validates ranges, invokes the ML model,
saves to MySQL database, and generates downloadable PDF reports.
"""

import io
from flask import Blueprint, request, jsonify, send_file
from routes.auth_routes import token_required
from database import execute_query
from ml.predict import predict_student_performance

predict_bp = Blueprint('predictions', __name__, url_prefix='/api/predictions')

@predict_bp.route('', methods=['POST'])
@token_required
def create_prediction(current_user):
    data = request.get_json() or {}
    
    # Optional or existing student link
    student_pk = data.get('student_id')
    student_name = data.get('student_name', '').strip()
    
    try:
        attendance = float(data.get('attendance', 0))
        previous_marks = float(data.get('previous_marks', 0))
        assignment_marks = float(data.get('assignment_marks', 0))
        study_hours = float(data.get('study_hours', 0))
        class_participation = float(data.get('class_participation', 0))
        internal_marks = float(data.get('internal_marks', 0))
        completed_assignments = int(data.get('completed_assignments', 0))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'All academic inputs must be valid numbers.'}), 400
        
    # Validation rules
    if not (0 <= attendance <= 100):
        return jsonify({'success': False, 'message': 'Attendance must be between 0% and 100%.'}), 400
    if not (0 <= previous_marks <= 100):
        return jsonify({'success': False, 'message': 'Previous marks must be between 0 and 100.'}), 400
    if not (0 <= assignment_marks <= 100):
        return jsonify({'success': False, 'message': 'Assignment marks must be between 0 and 100.'}), 400
    if not (0 <= study_hours <= 16):
        return jsonify({'success': False, 'message': 'Daily study hours must be between 0 and 16.'}), 400
    if not (0 <= class_participation <= 10):
        return jsonify({'success': False, 'message': 'Class participation must be between 0 and 10.'}), 400
    if not (0 <= internal_marks <= 100):
        return jsonify({'success': False, 'message': 'Internal assessment marks must be between 0 and 100.'}), 400
    if not (0 <= completed_assignments <= 20):
        return jsonify({'success': False, 'message': 'Completed assignments must be between 0 and 20.'}), 400
        
    features = {
        'attendance': attendance,
        'previous_marks': previous_marks,
        'assignment_marks': assignment_marks,
        'study_hours': study_hours,
        'class_participation': class_participation,
        'internal_marks': internal_marks,
        'completed_assignments': completed_assignments
    }
    
    # ML Prediction
    ml_result = predict_student_performance(features)
    predicted_marks = ml_result['predicted_marks']
    category = ml_result['performance_category']
    
    # Resolve student reference
    db_student_id = None
    if student_pk:
        # Check if student exists
        student = execute_query(
            "SELECT id, full_name FROM students WHERE (id = %s OR student_id = %s) AND created_by = %s",
            (student_pk, str(student_pk), current_user['id']),
            fetch='one'
        )
        if student:
            db_student_id = student['id']
            student_name = student['full_name']
            
    if not db_student_id:
        # Create an auto student profile if student name or ID was provided
        code = str(data.get('student_code') or f"STU-{int(request.environ.get('REQUEST_TIME', 0)) % 100000}")
        name = student_name or "Guest Student"
        email = data.get('student_email') or f"{code.lower()}@gradelytics.edu"
        
        # Check if code exists
        existing = execute_query("SELECT id FROM students WHERE student_id = %s", (code,), fetch='one')
        if existing:
            db_student_id = existing['id']
        else:
            db_student_id = execute_query(
                """
                INSERT INTO students (student_id, full_name, email, course, semester, attendance, previous_marks, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (code, name, email, 'BCA', 1, attendance, previous_marks, current_user['id']),
                last_id=True
            )
            
    # Save Prediction to Database
    prediction_id = execute_query(
        """
        INSERT INTO predictions (
            student_id, user_id, attendance, previous_marks, assignment_marks,
            study_hours, class_participation, internal_marks, completed_assignments,
            predicted_marks, performance_category
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            db_student_id, current_user['id'], attendance, previous_marks, assignment_marks,
            study_hours, class_participation, internal_marks, completed_assignments,
            predicted_marks, category
        ),
        last_id=True
    )
    
    # Update student's attendance & previous marks to reflect latest
    execute_query(
        "UPDATE students SET attendance = %s, previous_marks = %s WHERE id = %s",
        (attendance, previous_marks, db_student_id)
    )
    
    saved_record = execute_query(
        """
        SELECT p.*, s.student_id AS student_code, s.full_name AS student_name, s.course, s.semester
        FROM predictions p
        JOIN students s ON p.student_id = s.id
        WHERE p.id = %s
        """,
        (prediction_id,),
        fetch='one'
    )
    
    return jsonify({
        'success': True,
        'message': 'Marks predicted and recorded successfully!',
        'prediction': saved_record,
        'analysis': ml_result
    }), 201

@predict_bp.route('', methods=['GET'])
@token_required
def get_predictions(current_user):
    search = request.args.get('q', '').strip()
    category = request.args.get('category', '').strip()
    
    query = """
        SELECT p.*, s.student_id AS student_code, s.full_name AS student_name, s.course, s.semester, s.email AS student_email
        FROM predictions p
        JOIN students s ON p.student_id = s.id
        WHERE p.user_id = %s
    """
    params = [current_user['id']]
    
    if search:
        query += " AND (s.full_name LIKE %s OR s.student_id LIKE %s)"
        term = f"%{search}%"
        params.extend([term, term])
        
    if category:
        query += " AND p.performance_category = %s"
        params.append(category)
        
    query += " ORDER BY p.created_at DESC"
    records = execute_query(query, tuple(params), fetch='all')
    
    return jsonify({
        'success': True,
        'count': len(records),
        'predictions': records
    }), 200

@predict_bp.route('/<int:pred_id>', methods=['GET'])
@token_required
def get_prediction_detail(current_user, pred_id):
    record = execute_query(
        """
        SELECT p.*, s.student_id AS student_code, s.full_name AS student_name, s.course, s.semester, s.email AS student_email
        FROM predictions p
        JOIN students s ON p.student_id = s.id
        WHERE p.id = %s AND p.user_id = %s
        """,
        (pred_id, current_user['id']),
        fetch='one'
    )
    if not record:
        return jsonify({'success': False, 'message': 'Prediction record not found.'}), 404
        
    # Reconstruct recommendations
    features = {
        'attendance': record['attendance'],
        'previous_marks': record['previous_marks'],
        'assignment_marks': record['assignment_marks'],
        'study_hours': record['study_hours'],
        'class_participation': record['class_participation'],
        'internal_marks': record['internal_marks'],
        'completed_assignments': record['completed_assignments']
    }
    analysis = predict_student_performance(features)
    
    return jsonify({
        'success': True,
        'prediction': record,
        'analysis': analysis
    }), 200

@predict_bp.route('/<int:pred_id>', methods=['DELETE'])
@token_required
def delete_prediction(current_user, pred_id):
    record = execute_query(
        "SELECT id FROM predictions WHERE id = %s AND user_id = %s",
        (pred_id, current_user['id']),
        fetch='one'
    )
    if not record:
        return jsonify({'success': False, 'message': 'Prediction record not found or unauthorized.'}), 404
        
    execute_query("DELETE FROM predictions WHERE id = %s", (pred_id,))
    return jsonify({'success': True, 'message': 'Prediction deleted successfully.'}), 200

@predict_bp.route('/<int:pred_id>/pdf', methods=['GET'])
@token_required
def generate_pdf_report(current_user, pred_id):
    """
    Generates a professional academic PDF report for a prediction using ReportLab.
    """
    record = execute_query(
        """
        SELECT p.*, s.student_id AS student_code, s.full_name AS student_name, s.course, s.semester, s.email AS student_email
        FROM predictions p
        JOIN students s ON p.student_id = s.id
        WHERE p.id = %s AND p.user_id = %s
        """,
        (pred_id, current_user['id']),
        fetch='one'
    )
    if not record:
        return jsonify({'success': False, 'message': 'Record not found.'}), 404
        
    features = {
        'attendance': record['attendance'],
        'previous_marks': record['previous_marks'],
        'assignment_marks': record['assignment_marks'],
        'study_hours': record['study_hours'],
        'class_participation': record['class_participation'],
        'internal_marks': record['internal_marks'],
        'completed_assignments': record['completed_assignments']
    }
    analysis = predict_student_performance(features)
    
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40, leftMargin=40,
            topMargin=40, bottomMargin=40
        )
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#172554'),
            fontName='Helvetica-Bold'
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#2563EB')
        )
        section_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#172554'),
            fontName='Helvetica-Bold'
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155')
        )
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Italic'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#64748B')
        )
        
        elements = []
        
        # Header
        elements.append(Paragraph("Gradelytics", title_style))
        elements.append(Paragraph("AI-Powered Student Performance Prediction System &bull; Official Academic Report", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceBefore=8, spaceAfter=15))
        
        # Student Info Table
        elements.append(Paragraph("Student & Assessment Overview", section_style))
        elements.append(Spacer(1, 6))
        
        student_data = [
            [Paragraph("<b>Student Name:</b>", body_style), Paragraph(record['student_name'], body_style),
             Paragraph("<b>Student ID:</b>", body_style), Paragraph(record['student_code'], body_style)],
            [Paragraph("<b>Course:</b>", body_style), Paragraph(record['course'], body_style),
             Paragraph("<b>Semester:</b>", body_style), Paragraph(f"Semester {record['semester']}", body_style)],
            [Paragraph("<b>Report Date:</b>", body_style), Paragraph(str(record['created_at'])[:19], body_style),
             Paragraph("<b>Evaluator:</b>", body_style), Paragraph(current_user['full_name'], body_style)]
        ]
        t_student = Table(student_data, colWidths=[100, 160, 100, 170])
        t_student.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_student)
        elements.append(Spacer(1, 15))
        
        # Prediction Result Box
        elements.append(Paragraph("Machine Learning Prediction Result", section_style))
        elements.append(Spacer(1, 6))
        
        pred_box_data = [
            [
                Paragraph("<b>Predicted Examination Marks</b>", body_style),
                Paragraph(f"<font size=18 color='#2563EB'><b>{record['predicted_marks']:.1f} / 100</b></font>", body_style),
                Paragraph(f"<b>Category:</b> {record['performance_category']}<br/><b>Risk:</b> {analysis['risk_status']}", body_style)
            ]
        ]
        t_pred = Table(pred_box_data, colWidths=[200, 160, 170])
        t_pred.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EFF6FF')),
            ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#2563EB')),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 10),
        ]))
        elements.append(t_pred)
        elements.append(Spacer(1, 15))
        
        # Academic Inputs Breakdown Table
        elements.append(Paragraph("Evaluated Input Parameters", section_style))
        elements.append(Spacer(1, 6))
        
        param_data = [
            ["Parameter", "Observed Value", "Benchmark / Max"],
            ["Class Attendance", f"{record['attendance']:.1f}%", "75% Target"],
            ["Previous Examination Marks", f"{record['previous_marks']:.1f} / 100", "Baseline"],
            ["Assignment Marks", f"{record['assignment_marks']:.1f} / 100", "Continuous Eval"],
            ["Daily Study Hours", f"{record['study_hours']:.1f} hrs/day", "3-5 hrs recommended"],
            ["Classroom Participation", f"{record['class_participation']:.1f} / 10", "Active Engagement"],
            ["Internal Assessment Marks", f"{record['internal_marks']:.1f} / 100", "Mid-term"],
            ["Completed Assignments", f"{record['completed_assignments']} completed", "Coursework"]
        ]
        t_param = Table(param_data, colWidths=[220, 150, 160])
        t_param.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ]))
        elements.append(t_param)
        elements.append(Spacer(1, 15))
        
        # Personalized Recommendations
        elements.append(Paragraph("Personalized Improvement Recommendations", section_style))
        elements.append(Spacer(1, 6))
        
        for r in analysis['recommendations']:
            bullet_text = f"<b>&bull; {r['category']}:</b> {r['recommendation']}"
            elements.append(Paragraph(bullet_text, body_style))
            elements.append(Spacer(1, 4))
            
        elements.append(Spacer(1, 15))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94A3B8'), spaceBefore=5, spaceAfter=8))
        elements.append(Paragraph(f"<b>Disclaimer:</b> {analysis['disclaimer']}", disclaimer_style))
        
        doc.build(elements)
        buffer.seek(0)
        
        filename = f"Gradelytics_Report_{record['student_code']}.pdf"
        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'success': False, 'message': f'PDF generation failed: {str(e)}'}), 500
