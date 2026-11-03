"""
Gradelytics - Authentication Routes & JWT Middleware
Handles user registration, login, profile updates, and route protection.
Uses Werkzeug for secure password hashing and PyJWT for token sessions.
"""

from functools import wraps
from datetime import datetime, timezone
import jwt
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config
from database import execute_query

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'success': False, 'message': 'Authorization header is missing.'}), 401
            
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'success': False, 'message': 'Invalid token format. Format must be Bearer <token>'}), 401
            
        token = parts[1]
        try:
            data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            user_id = data.get('user_id')
            user = execute_query(
                "SELECT id, full_name, email, created_at FROM users WHERE id = %s",
                (user_id,),
                fetch='one'
            )
            if not user:
                return jsonify({'success': False, 'message': 'User associated with token not found.'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Session expired. Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Invalid authentication token.'}), 401
        except Exception as e:
            return jsonify({'success': False, 'message': f'Authentication error: {str(e)}'}), 401
            
        return f(current_user=user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    
    if not full_name or not email or not password:
        return jsonify({'success': False, 'message': 'All fields are required.'}), 400
        
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters long.'}), 400
        
    if confirm_password and password != confirm_password:
        return jsonify({'success': False, 'message': 'Passwords do not match.'}), 400
        
    # Check if user already exists
    existing = execute_query("SELECT id FROM users WHERE email = %s", (email,), fetch='one')
    if existing:
        return jsonify({'success': False, 'message': 'An account with this email already exists.'}), 409
        
    # Hash password with secure werkzeug
    password_hash = generate_password_hash(password)
    
    try:
        user_id = execute_query(
            "INSERT INTO users (full_name, email, password_hash) VALUES (%s, %s, %s)",
            (full_name, email, password_hash),
            last_id=True
        )
        
        # Generate JWT
        now = datetime.now(timezone.utc)
        payload = {
            'user_id': user_id,
            'email': email,
            'iat': now,
            'exp': now + Config.JWT_ACCESS_TOKEN_EXPIRES
        }
        token = jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully!',
            'token': token,
            'user': {
                'id': user_id,
                'full_name': full_name,
                'email': email
            }
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Please enter both email and password.'}), 400
        
    user = execute_query(
        "SELECT id, full_name, email, password_hash FROM users WHERE email = %s",
        (email,),
        fetch='one'
    )
    
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401
        
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user['id'],
        'email': user['email'],
        'iat': now,
        'exp': now + Config.JWT_ACCESS_TOKEN_EXPIRES
    }
    token = jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')
    
    return jsonify({
        'success': True,
        'message': 'Login successful!',
        'token': token,
        'user': {
            'id': user['id'],
            'full_name': user['full_name'],
            'email': user['email']
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user_profile(current_user):
    return jsonify({
        'success': True,
        'user': current_user
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    
    if not full_name:
        return jsonify({'success': False, 'message': 'Full name cannot be empty.'}), 400
        
    execute_query(
        "UPDATE users SET full_name = %s WHERE id = %s",
        (full_name, current_user['id'])
    )
    
    return jsonify({
        'success': True,
        'message': 'Profile updated successfully!',
        'user': {
            'id': current_user['id'],
            'full_name': full_name,
            'email': current_user['email']
        }
    }), 200

@auth_bp.route('/change-password', methods=['PUT'])
@token_required
def change_password(current_user):
    data = request.get_json() or {}
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')
    
    if not old_password or not new_password:
        return jsonify({'success': False, 'message': 'Both current and new passwords are required.'}), 400
        
    if len(new_password) < 6:
        return jsonify({'success': False, 'message': 'New password must be at least 6 characters.'}), 400
        
    user_record = execute_query(
        "SELECT password_hash FROM users WHERE id = %s",
        (current_user['id'],),
        fetch='one'
    )
    
    if not check_password_hash(user_record['password_hash'], old_password):
        return jsonify({'success': False, 'message': 'Current password is incorrect.'}), 400
        
    new_hash = generate_password_hash(new_password)
    execute_query("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, current_user['id']))
    
    return jsonify({'success': True, 'message': 'Password updated successfully!'}), 200
