"""
Gradelytics - Student Management Routes
Full CRUD operations, search, filters, individual student profile with prediction history,
and CSV bulk student import with validation.
"""

import csv
import io
from flask import Blueprint, request, jsonify
from routes.auth_routes import token_required
from database import execute_query

student_bp = Blueprint('students', __name__, url_prefix='/api/students')

@student_bp.route('', methods=['GET'])
@token_required
def get_students(current_user):
    search = request.args.get('q', '').strip()
    semester = request.args.get('semester', '').strip()
    
    query = """
        SELECT s.*, 
               p.predicted_marks AS latest_predicted_marks,
               p.performance_category AS latest_category,
               p.created_at AS latest_prediction_date
        FROM students s
        LEFT JOIN (
            SELECT p1.*
            FROM predictions p1
            INNER JOIN (
                SELECT student_id, MAX(id) as max_id
                FROM predictions
                GROUP BY student_id
            ) p2 ON p1.id = p2.max_id
        ) p ON s.id = p.student_id
        WHERE s.created_by = %s
    """
    params = [current_user['id']]
    
    if search:
        query += " AND (s.full_name LIKE %s OR s.student_id LIKE %s OR s.course LIKE %s OR s.email LIKE %s)"
        term = f"%{search}%"
        params.extend([term, term, term, term])
        
    if semester and semester.isdigit():
        query += " AND s.semester = %s"
        params.append(int(semester))
        
    query += " ORDER BY s.id DESC"
    students = execute_query(query, tuple(params), fetch='all')
    
    return jsonify({
        'success': True,
        'count': len(students),
        'students': students
    }), 200

@student_bp.route('', methods=['POST'])
@token_required
def create_student(current_user):
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    course = data.get('course', 'BCA').strip()
    
    try:
        semester = int(data.get('semester', 1))
        attendance = float(data.get('attendance', 0))
        previous_marks = float(data.get('previous_marks', 0))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Semester, Attendance, and Previous Marks must be numeric.'}), 400
        
    if not student_id or not full_name or not email:
        return jsonify({'success': False, 'message': 'Student ID, Full Name, and Email are required.'}), 400
        
    if not (0 <= attendance <= 100) or not (0 <= previous_marks <= 100):
        return jsonify({'success': False, 'message': 'Attendance and Previous Marks must be between 0 and 100.'}), 400
        
    # Check duplicate student_id
    existing = execute_query("SELECT id FROM students WHERE student_id = %s", (student_id,), fetch='one')
    if existing:
        return jsonify({'success': False, 'message': f'Student ID "{student_id}" is already registered.'}), 409
        
    new_id = execute_query(
        """
        INSERT INTO students (student_id, full_name, email, course, semester, attendance, previous_marks, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (student_id, full_name, email, course, semester, attendance, previous_marks, current_user['id']),
        last_id=True
    )
    
    created_student = execute_query("SELECT * FROM students WHERE id = %s", (new_id,), fetch='one')
    return jsonify({
        'success': True,
        'message': 'Student added successfully!',
        'student': created_student
    }), 201

@student_bp.route('/<int:student_pk>', methods=['GET'])
@token_required
def get_student_detail(current_user, student_pk):
    student = execute_query(
        "SELECT * FROM students WHERE id = %s AND created_by = %s",
        (student_pk, current_user['id']),
        fetch='one'
    )
    if not student:
        return jsonify({'success': False, 'message': 'Student not found.'}), 404
        
    # Fetch prediction history for this student
    predictions = execute_query(
        """
        SELECT * FROM predictions 
        WHERE student_id = %s 
        ORDER BY created_at DESC
        """,
        (student_pk,),
        fetch='all'
    )
    
    return jsonify({
        'success': True,
        'student': student,
        'predictions': predictions
    }), 200

@student_bp.route('/<int:student_pk>', methods=['PUT'])
@token_required
def update_student(current_user, student_pk):
    data = request.get_json() or {}
    
    student = execute_query(
        "SELECT * FROM students WHERE id = %s AND created_by = %s",
        (student_pk, current_user['id']),
        fetch='one'
    )
    if not student:
        return jsonify({'success': False, 'message': 'Student not found or unauthorized.'}), 404
        
    full_name = data.get('full_name', student['full_name']).strip()
    email = data.get('email', student['email']).strip().lower()
    course = data.get('course', student['course']).strip()
    
    try:
        semester = int(data.get('semester', student['semester']))
        attendance = float(data.get('attendance', student['attendance']))
        previous_marks = float(data.get('previous_marks', student['previous_marks']))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid numeric values.'}), 400
        
    execute_query(
        """
        UPDATE students
        SET full_name = %s, email = %s, course = %s, semester = %s, attendance = %s, previous_marks = %s
        WHERE id = %s AND created_by = %s
        """,
        (full_name, email, course, semester, attendance, previous_marks, student_pk, current_user['id'])
    )
    
    updated_student = execute_query("SELECT * FROM students WHERE id = %s", (student_pk,), fetch='one')
    return jsonify({
        'success': True,
        'message': 'Student details updated successfully!',
        'student': updated_student
    }), 200

@student_bp.route('/<int:student_pk>', methods=['DELETE'])
@token_required
def delete_student(current_user, student_pk):
    student = execute_query(
        "SELECT id FROM students WHERE id = %s AND created_by = %s",
        (student_pk, current_user['id']),
        fetch='one'
    )
    if not student:
        return jsonify({'success': False, 'message': 'Student not found or unauthorized.'}), 404
        
    execute_query("DELETE FROM students WHERE id = %s AND created_by = %s", (student_pk, current_user['id']))
    return jsonify({'success': True, 'message': 'Student deleted successfully.'}), 200

@student_bp.route('/import-csv', methods=['POST'])
@token_required
def import_csv(current_user):
    """
    Imports student records from CSV file or raw payload.
    Validates records, skips duplicates, and returns detailed counts.
    """
    if 'file' in request.files:
        file = request.files['file']
        stream = io.StringIO(file.stream.read().decode("UTF8", errors='ignore'), newline=None)
        csv_reader = csv.DictReader(stream)
    else:
        # Check JSON payload containing rows
        data = request.get_json() or {}
        rows = data.get('rows', [])
        csv_reader = rows

    success_count = 0
    failed_count = 0
    errors = []
    
    for idx, row in enumerate(csv_reader, start=1):
        try:
            student_id = str(row.get('student_id', '')).strip()
            full_name = str(row.get('full_name', '')).strip()
            email = str(row.get('email', '')).strip().lower()
            course = str(row.get('course', 'BCA')).strip()
            semester = int(row.get('semester', 1))
            attendance = float(row.get('attendance', 75.0))
            previous_marks = float(row.get('previous_marks', 65.0))
            
            if not student_id or not full_name or not email:
                failed_count += 1
                errors.append(f"Row {idx}: Missing student_id, full_name or email.")
                continue
                
            # Duplicate check
            existing = execute_query("SELECT id FROM students WHERE student_id = %s", (student_id,), fetch='one')
            if existing:
                failed_count += 1
                errors.append(f"Row {idx}: Student ID '{student_id}' already exists.")
                continue
                
            execute_query(
                """
                INSERT INTO students (student_id, full_name, email, course, semester, attendance, previous_marks, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (student_id, full_name, email, course, semester, attendance, previous_marks, current_user['id'])
            )
            success_count += 1
        except Exception as e:
            failed_count += 1
            errors.append(f"Row {idx}: {str(e)}")
            
    return jsonify({
        'success': True,
        'message': f"CSV import processed: {success_count} added, {failed_count} skipped.",
        'imported_count': success_count,
        'failed_count': failed_count,
        'errors': errors[:10]  # First 10 error messages
    }), 200
