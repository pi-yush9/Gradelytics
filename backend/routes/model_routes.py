"""
Gradelytics - Machine Learning Model Information API
Exposes model architecture details, dataset characteristics, regression metrics
(MAE, RMSE, R²), feature importances, and academic explanations for BCA viva presentations.
"""

import os
import json
from flask import Blueprint, jsonify
from routes.auth_routes import token_required

model_bp = Blueprint('model_info', __name__, url_prefix='/api/model-info')

@model_bp.route('', methods=['GET'])
@token_required
def get_model_information(current_user):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    meta_json_path = os.path.join(base_dir, '..', 'saved_model', 'model_metrics.json')
    
    if not os.path.exists(meta_json_path):
        from ml.train_model import train_and_evaluate
        train_and_evaluate()
        
    with open(meta_json_path, 'r') as f:
        metadata = json.load(f)
        
    return jsonify({
        'success': True,
        'model_info': metadata
    }), 200
