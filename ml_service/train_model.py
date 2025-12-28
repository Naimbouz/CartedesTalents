import os
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# MongoDB Connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/talentcard')
try:
    client = MongoClient(MONGO_URI)
    db = client.get_database()
    talent_collection = db.talents
    print("Connected to MongoDB")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    exit(1)

def get_data():
    talents = list(talent_collection.find())
    if len(talents) < 5:
        print("Not enough data in DB, generating mock data for training...")
        return generate_mock_data()
    return pd.DataFrame(talents)

def generate_mock_data():
    # Mock data to simulate varied profiles
    data = [
        {"skills": ["React", "Node.js", "MongoDB"], "projects": ["E-commerce site", "Chat app"], "languages": ["English", "French"], "verified": True},
        {"skills": ["HTML", "CSS"], "projects": ["Portfolio"], "languages": ["English"], "verified": False},
        {"skills": ["Python", "Data Science", "Pandas"], "projects": ["Stock predictor"], "languages": ["English", "German"], "verified": True},
        {"skills": [], "projects": [], "languages": [], "verified": False},
        {"skills": ["Java", "Spring"], "projects": ["Bank system"], "languages": ["French"], "verified": True},
        {"skills": ["C++"], "projects": ["Game"], "languages": ["English"], "verified": True},
        {"skills": ["Word", "Excel"], "projects": [], "languages": ["French"], "verified": False},
        {"skills": ["Javascript", "React"], "projects": ["Todo list"], "languages": ["English"], "verified": True},
        {"skills": ["Unknown"], "projects": [], "languages": [], "verified": False},
        {"skills": ["Go", "Docker", "Kubernetes"], "projects": ["Microservices"], "languages": ["English", "Spanish"], "verified": True},
    ]
    return pd.DataFrame(data)

def preprocess(df):
    # Combine text features
    df['text_features'] = df.apply(lambda x: ' '.join(x.get('skills', [])) + ' ' + 
                                             ' '.join(x.get('projects', [])) + ' ' + 
                                             ' '.join(x.get('languages', [])), axis=1)
    return df

import json
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix

def train():
    df = get_data()
    df = preprocess(df)
    
    X = df['text_features']
    y = df['verified']

    # Text processing and model pipeline
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english', max_features=1000)),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])

    # Split data to get evaluation metrics
    # If we have very little data (mock data has 10 rows), a split might be tiny.
    # But for the sake of the feature, we will force a split or usage of the same set if strictly necessary, 
    # but proper ML requires a split.
    if len(df) < 5:
        # Fallback for tiny data: train and test on same (overfitting but shows the matrix)
        X_train, X_test, y_train, y_test = X, X, y, y
    else:
        # Use a small test size if data is small
        test_size = 0.3 if len(df) > 20 else 0.5
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
    
    pipeline.fit(X_train, y_train)
    
    print("Model trained.")
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    cm = confusion_matrix(y_test, y_pred)
    
    # Calculate simple metrics
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0,0,0,0) # Handle edge case if only 1 class 
    # (If only 1 class implies cm is 1x1, ravel won't unpack to 4)
    
    if cm.shape == (1, 1):
        # Could be Tn or Tp depending on the label
        # This is a crude fallback for the mock data edge case
        score = pipeline.score(X_test, y_test)
        if y_test.iloc[0]: tp = cm[0,0]
        else: tn = cm[0,0]

    metrics = {
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp)
        },
        "accuracy": float(pipeline.score(X_test, y_test)),
        "total_samples": len(y)
    }

    # Save model
    model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")
    
    # Save metrics
    metrics_path = os.path.join(os.path.dirname(__file__), 'metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f)
    print(f"Metrics saved to {metrics_path}")

if __name__ == "__main__":
    train()
