"""
Gradelytics - AI-Powered Student Performance Prediction System
Flask Backend Application Entry Point
"""

import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import init_db

# Route blueprints
from routes.auth_routes import auth_bp
from routes.student_routes import student_bp
from routes.predict_routes import predict_bp
from routes.dashboard_routes import dashboard_bp
from routes.analytics_routes import analytics_bp
from routes.model_routes import model_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )
    
    # Initialize Database tables
    with app.app_context():
        try:
            init_db()
        except Exception as e:
            print(f"[ERROR] Database init exception: {e}")
            
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(predict_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(model_bp)
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'application': 'Gradelytics API',
            'version': '1.0.0',
            'model': 'Active'
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'API endpoint not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() in ('true', '1')
    print(f"\n=======================================================")
    print(f" Gradelytics Backend Server")
    print(f" Predict Better. Perform Better.")
    print(f" Running on http://127.0.0.1:{port}")
    print(f"=======================================================\n")
    app.run(host='0.0.0.0', port=port, debug=debug)
