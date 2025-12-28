from flask import Flask, request, jsonify
import json
import joblib
import pandas as pd
import os
import sys
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from train_model import train

app = Flask(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')

def load_model():
    if not os.path.exists(MODEL_PATH):
        print("Model not found, training new model...")
        train()
    return joblib.load(MODEL_PATH)

model = load_model()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'talent-prediction-ml'})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        # Expecting data structure similar to Talent model
        # { "skills": [...], "projects": [...], "languages": [...] }
        
        # Preprocess input
        skills = data.get('skills', [])
        projects = data.get('projects', [])
        languages = data.get('languages', [])
        
        # Combine into text feature (same as training)
        text_feature = ' '.join(skills) + ' ' + ' '.join(projects) + ' ' + ' '.join(languages)
        
        # Create DataFrame for compatibility (though pipeline handles series/list)
        # The pipeline expects an iterable of strings
        prediction = model.predict([text_feature])[0]
        probability = model.predict_proba([text_feature])[0].max()
        
        result = {
            'is_valid_prediction': bool(prediction),
            'confidence': float(probability),
            'features_analyzed': {
                'skills_count': len(skills),
                'projects_count': len(projects),
                'languages_count': len(languages)
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Prediction Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/match', methods=['POST'])
def match():
    try:
        data = request.json
        job_description = data.get('job_description', '')
        talent_profile = data.get('talent_profile', '')
        
        if not job_description or not talent_profile:
            return jsonify({'error': 'Missing job_description or talent_profile'}), 400

        # Create text corpus
        corpus = [job_description, talent_profile]
        
        # Calculate TF-IDF
        # We process just these two documents to get their relative similarity based on shared terms
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        # Calculate Cosine Similarity
        # tfidf_matrix[0] is job_desc, tfidf_matrix[1] is talent_profile
        similarity_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        
        # Extract matching keywords for explaining the score
        feature_names = vectorizer.get_feature_names_out()
        
        # Get dense array for simple processing
        dense = tfidf_matrix.todense()
        job_vec = dense[0].tolist()[0]
        talent_vec = dense[1].tolist()[0]
        
        # Find words present in both with non-zero weight
        matching_terms = []
        for i, term in enumerate(feature_names):
            if job_vec[i] > 0 and talent_vec[i] > 0:
                matching_terms.append(term)
        
        return jsonify({
            'match_score': float(similarity_score), # 0 to 1
            'match_percentage': float(similarity_score * 100),
            'matching_terms': matching_terms
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/retrain', methods=['POST'])
def retrain():
    try:
        train()
        global model
        model = load_model()
        return jsonify({'message': 'Model retrained successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/metrics', methods=['GET'])
def get_metrics():
    try:
        metrics_path = os.path.join(os.path.dirname(__file__), 'metrics.json')
        if not os.path.exists(metrics_path):
            return jsonify({'error': 'Metrics not found. Train the model first.'}), 404
            
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
        
        return jsonify(metrics)
            
    except Exception as e:
        print(f"Metrics Error: {e}")
        return jsonify({'error': str(e)}), 500

import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import threading
import subprocess

@app.route('/visualize', methods=['POST'])
def visualize():
    try:
        metrics_path = os.path.join(os.path.dirname(__file__), 'metrics.json')
        if not os.path.exists(metrics_path):
            return jsonify({'error': 'Metrics not found. Train the model first.'}), 404
            
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
            
        # Run independent script to show plot without blocking Flask
        viz_script = os.path.join(os.path.dirname(__file__), 'visualize_standalone.py')
        subprocess.Popen([sys.executable, viz_script])
        
        return jsonify({'message': 'Visualization opened'})
        
        return jsonify({'message': 'Visualization opened'})
    except Exception as e:
        print(f"Visualize Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
