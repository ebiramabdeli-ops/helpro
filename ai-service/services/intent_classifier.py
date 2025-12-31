"""
Intent Classifier - ML-based intent detection (NO LLM)
Uses scikit-learn with TF-IDF + Logistic Regression
"""
import json
import os
from typing import Dict, List, Any, Optional
from pathlib import Path
import structlog

logger = structlog.get_logger()


class IntentClassifier:
    """
    Intent Classification using classical ML
    - TF-IDF vectorization
    - Logistic Regression
    - Per-language models
    - Trainable with 200-500 examples per intent
    """
    
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.vectorizers: Dict[str, Any] = {}
        self.intents: List[str] = [
            "service_request",      # User wants to book a service
            "service_inquiry",      # User asks about service details
            "price_inquiry",        # User asks about pricing
            "availability_check",   # User checks availability
            "booking_modify",       # User wants to change booking
            "booking_cancel",       # User wants to cancel
            "complaint",            # User has a complaint
            "payment_issue",        # Payment problem
            "identity_question",    # Question about verification
            "support_request",      # General support
            "emergency",            # Urgent/emergency situation
            "feedback",             # User giving feedback/review
            "other",                # None of the above
        ]
        
        # Load pre-trained models (if exist)
        self._load_models()
    
    def _load_models(self):
        """Load pre-trained models from disk"""
        models_dir = Path(__file__).parent.parent / "models"
        
        if not models_dir.exists():
            logger.warning("models_directory_not_found", message="Using rule-based fallback")
            return
        
        # Try to load models
        try:
            import joblib
            
            for lang in ["en", "de", "fr", "es", "it", "sv", "nb", "da", "fi"]:
                model_path = models_dir / f"intent_classifier_{lang}.pkl"
                vectorizer_path = models_dir / f"vectorizer_{lang}.pkl"
                
                if model_path.exists() and vectorizer_path.exists():
                    self.models[lang] = joblib.load(model_path)
                    self.vectorizers[lang] = joblib.load(vectorizer_path)
                    logger.info(f"✅ Intent classifier loaded for {lang}")
        
        except Exception as e:
            logger.warning("model_load_failed", error=str(e))
    
    def classify(
        self, 
        text: str, 
        language: str = "en-GB", 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Classify user intent
        
        Returns:
            {
                "intent": "service_request",
                "confidence": 0.95,
                "service_category": "cleaning",
                "fallback": false
            }
        """
        lang_code = language.split("-")[0]  # en-GB -> en
        
        # Try ML model first
        if lang_code in self.models:
            return self._classify_ml(text, lang_code, context)
        
        # Fallback to rule-based
        return self._classify_rules(text, language, context)
    
    def _classify_ml(
        self, 
        text: str, 
        lang_code: str, 
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Classify using ML model"""
        try:
            model = self.models[lang_code]
            vectorizer = self.vectorizers[lang_code]
            
            # Vectorize text
            text_vector = vectorizer.transform([text])
            
            # Predict
            intent_idx = model.predict(text_vector)[0]
            probabilities = model.predict_proba(text_vector)[0]
            
            intent = self.intents[intent_idx]
            confidence = float(probabilities[intent_idx])
            
            # Detect service category
            service_category = self._detect_service_category(text)
            
            return {
                "intent": intent,
                "confidence": confidence,
                "service_category": service_category,
                "fallback": False
            }
        
        except Exception as e:
            logger.error("ml_classification_error", error=str(e))
            return self._classify_rules(text, f"{lang_code}-XX", context)
    
    def _classify_rules(
        self, 
        text: str, 
        language: str, 
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Rule-based intent classification (fallback)
        Uses keyword matching
        """
        text_lower = text.lower()
        
        # Intent patterns (multilingual)
        patterns = {
            "service_request": {
                "en": ["need", "want", "looking for", "hire", "book", "help with"],
                "de": ["brauche", "möchte", "suche", "buchen", "hilfe bei"],
                "fr": ["besoin", "veux", "cherche", "réserver", "aide pour"],
                "es": ["necesito", "quiero", "busco", "reservar", "ayuda con"],
                "it": ["bisogno", "voglio", "cerco", "prenotare", "aiuto con"],
                "sv": ["behöver", "vill", "söker", "boka", "hjälp med"],
            },
            "price_inquiry": {
                "en": ["how much", "cost", "price", "expensive", "cheap"],
                "de": ["wie viel", "kosten", "preis", "teuer", "günstig"],
                "fr": ["combien", "coût", "prix", "cher", "bon marché"],
                "es": ["cuánto", "costo", "precio", "caro", "barato"],
                "it": ["quanto", "costo", "prezzo", "costoso", "economico"],
                "sv": ["hur mycket", "kostnad", "pris", "dyr", "billig"],
            },
            "complaint": {
                "en": ["complaint", "unhappy", "disappointed", "problem", "bad", "terrible"],
                "de": ["beschwerde", "unzufrieden", "enttäuscht", "problem", "schlecht"],
                "fr": ["plainte", "mécontent", "déçu", "problème", "mauvais"],
                "es": ["queja", "infeliz", "decepcionado", "problema", "malo"],
                "it": ["reclamo", "infelice", "deluso", "problema", "cattivo"],
                "sv": ["klagomål", "missnöjd", "besviken", "problem", "dålig"],
            },
            "emergency": {
                "en": ["emergency", "urgent", "asap", "immediately", "help"],
                "de": ["notfall", "dringend", "sofort", "hilfe"],
                "fr": ["urgence", "urgent", "immédiatement", "aide"],
                "es": ["emergencia", "urgente", "inmediatamente", "ayuda"],
                "it": ["emergenza", "urgente", "immediatamente", "aiuto"],
                "sv": ["nödsituation", "brådskande", "omedelbart", "hjälp"],
            },
            "booking_cancel": {
                "en": ["cancel", "cancel booking", "don't want", "remove"],
                "de": ["stornieren", "absagen", "nicht mehr", "entfernen"],
                "fr": ["annuler", "ne veux plus", "supprimer"],
                "es": ["cancelar", "no quiero", "eliminar"],
                "it": ["cancellare", "non voglio", "rimuovere"],
                "sv": ["avboka", "vill inte", "ta bort"],
            },
        }
        
        lang_code = language.split("-")[0]
        
        # Score each intent
        scores = {}
        for intent, lang_patterns in patterns.items():
            keywords = lang_patterns.get(lang_code, lang_patterns.get("en", []))
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                scores[intent] = score
        
        # Get best intent
        if scores:
            best_intent = max(scores, key=scores.get)
            confidence = min(0.7 + (scores[best_intent] * 0.1), 0.95)
        else:
            best_intent = "other"
            confidence = 0.5
        
        # Detect service category
        service_category = self._detect_service_category(text)
        
        return {
            "intent": best_intent,
            "confidence": confidence,
            "service_category": service_category,
            "fallback": True
        }
    
    def _detect_service_category(self, text: str) -> Optional[str]:
        """Detect which service category user is referring to"""
        text_lower = text.lower()
        
        categories = {
            "cleaning": ["clean", "cleaning", "wash", "mop", "vacuum"],
            "moving": ["move", "moving", "transport", "relocate"],
            "recycling": ["recycle", "waste", "trash", "dispose", "remove"],
            "handyman": ["fix", "repair", "install", "broken"],
            "gardening": ["garden", "lawn", "mow", "plant"],
            "delivery": ["deliver", "pickup", "fetch", "bring"],
        }
        
        for category, keywords in categories.items():
            if any(keyword in text_lower for keyword in keywords):
                return category
        
        return None
    
    def train(self, training_data: List[Dict[str, str]], language: str = "en"):
        """
        Train intent classifier for a language
        
        Args:
            training_data: List of {"text": "...", "intent": "service_request"}
            language: Language code (en, de, fr, etc.)
        
        Example:
            classifier.train([
                {"text": "I need help moving furniture", "intent": "service_request"},
                {"text": "How much does cleaning cost?", "intent": "price_inquiry"},
                # ... 200-500 examples
            ], language="en")
        """
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.linear_model import LogisticRegression
            from sklearn.pipeline import Pipeline
            import joblib
            
            # Prepare training data
            texts = [item["text"] for item in training_data]
            intents = [item["intent"] for item in training_data]
            
            # Create vectorizer
            vectorizer = TfidfVectorizer(
                max_features=1000,
                ngram_range=(1, 2),  # Unigrams + bigrams
                min_df=2
            )
            
            # Train model
            X = vectorizer.fit_transform(texts)
            
            model = LogisticRegression(
                max_iter=1000,
                multi_class="multinomial",
                solver="lbfgs"
            )
            model.fit(X, intents)
            
            # Save models
            models_dir = Path(__file__).parent.parent / "models"
            models_dir.mkdir(exist_ok=True)
            
            joblib.dump(model, models_dir / f"intent_classifier_{language}.pkl")
            joblib.dump(vectorizer, models_dir / f"vectorizer_{language}.pkl")
            
            # Load into memory
            self.models[language] = model
            self.vectorizers[language] = vectorizer
            
            logger.info(f"✅ Intent classifier trained for {language}", samples=len(training_data))
            
            return {
                "status": "success",
                "language": language,
                "samples": len(training_data),
                "intents": len(set(intents))
            }
        
        except Exception as e:
            logger.error("training_failed", error=str(e))
            return {"status": "error", "error": str(e)}
