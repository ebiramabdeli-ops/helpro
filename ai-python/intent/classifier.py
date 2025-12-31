"""
Component 2: INTENT CLASSIFICATION
Purpose: Understand what the user wants (NO LLM)
Method: TF-IDF + Logistic Regression + Rule-based fallback
"""

import re
import pickle
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

class IntentClassifier:
    """
    Rule-based + ML intent classifier
    Hybrid approach: Rules for high-confidence cases, ML for ambiguous
    """
    
    # Intent types (must match TypeScript enum)
    INTENTS = [
        'REQUEST_SERVICE',
        'ASK_PRICE',
        'ASK_AVAILABILITY',
        'MODIFY_REQUEST',
        'CANCEL_REQUEST',
        'ASK_STATUS',
        'GREETING',
        'HELP',
        'UNKNOWN'
    ]
    
    # High-confidence keyword patterns (rule-based)
    KEYWORD_PATTERNS = {
        'REQUEST_SERVICE': [
            r'\b(need|want|looking for|require|help with|brauche|möchte|suche|behöver)\b',
            r'\b(service|assistance|hilfe|hjälp)\b'
        ],
        'ASK_PRICE': [
            r'\b(cost|price|how much|kosten|preis|wie viel|pris)\b',
            r'\b(€|dollar|euro|kr|currency)\b'
        ],
        'ASK_AVAILABILITY': [
            r'\b(available|free|when|verfügbar|frei|wann|tillgänglig)\b'
        ],
        'CANCEL_REQUEST': [
            r'\b(cancel|abort|stop|stornieren|abbrechen|avbryt)\b'
        ],
        'ASK_STATUS': [
            r'\b(status|progress|update|stand|fortschritt)\b'
        ],
        'GREETING': [
            r'\b(hello|hi|hey|hallo|hej|hola)\b'
        ],
        'HELP': [
            r'\b(help|how does|what can|hilfe|wie funktioniert|hjälp)\b'
        ]
    }
    
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or 'models/intent_model.pkl'
        self.pipeline = None
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=500,
            lowercase=True,
            strip_accents='unicode'
        )
        self.classifier = LogisticRegression(max_iter=1000, random_state=42)
        self.is_trained = False
        
    def preprocess(self, text: str) -> str:
        """Normalize text"""
        text = text.lower().strip()
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        return text
    
    def rule_based_classification(self, text: str) -> Optional[Tuple[str, float]]:
        """
        Try rule-based classification first (fast, deterministic)
        Returns (intent, confidence) or None
        """
        text = self.preprocess(text)
        
        matches = {}
        for intent, patterns in self.KEYWORD_PATTERNS.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    score += 1
            if score > 0:
                matches[intent] = score
        
        if not matches:
            return None
        
        # Get best match
        best_intent = max(matches, key=matches.get)
        confidence = min(0.5 + (matches[best_intent] * 0.2), 1.0)
        
        # High confidence threshold for rules
        if confidence >= 0.7:
            return (best_intent, confidence)
        
        return None
    
    def ml_classification(self, text: str) -> Tuple[str, float]:
        """
        ML-based classification (for ambiguous cases)
        """
        if self.pipeline is None:
            # Fallback if no model trained
            return ('UNKNOWN', 0.3)
        
        text = self.preprocess(text)
        
        # Predict
        intent = self.pipeline.predict([text])[0]
        probs = self.pipeline.predict_proba([text])[0]
        confidence = float(np.max(probs))
        
        return (intent, confidence)
    
    def classify(self, text: str) -> Dict[str, any]:
        """
        Main classification method
        1. Try rule-based (fast, deterministic)
        2. Fall back to ML if ambiguous
        """
        # Try rules first
        rule_result = self.rule_based_classification(text)
        if rule_result:
            intent, confidence = rule_result
            return {
                'intent': intent,
                'confidence': confidence,
                'method': 'rule-based'
            }
        
        # Fall back to ML
        intent, confidence = self.ml_classification(text)
        return {
            'intent': intent,
            'confidence': confidence,
            'method': 'ml'
        }
    
    def train(self, texts: List[str], labels: List[str]):
        """
        Train ML classifier on labeled data
        Called offline, NOT per-request
        """
        print(f"Training intent classifier on {len(texts)} examples...")
        
        # Create pipeline
        self.pipeline = Pipeline([
            ('tfidf', self.vectorizer),
            ('classifier', self.classifier)
        ])
        
        # Train
        self.pipeline.fit(texts, labels)
        
        print("Training complete!")
        
    def save(self):
        """Save trained model"""
        Path(self.model_path).parent.mkdir(parents=True, exist_ok=True)
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.pipeline, f)
        print(f"Model saved to {self.model_path}")
    
    def load(self):
        """Load trained model"""
        try:
            with open(self.model_path, 'rb') as f:
                self.pipeline = pickle.load(f)
            print(f"Model loaded from {self.model_path}")
            return True
        except FileNotFoundError:
            print(f"No model found at {self.model_path}. Using rule-based only.")
            return False


# Singleton instance
_classifier = None

def get_classifier() -> IntentClassifier:
    """Get or create classifier instance"""
    global _classifier
    if _classifier is None:
        _classifier = IntentClassifier()
        _classifier.load()  # Try to load existing model
    return _classifier
