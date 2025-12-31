"""
NLP Service - Light NLP without LLM
Uses spaCy for entity extraction, pattern matching for intent detection
"""
import re
from typing import Dict, List, Any, Optional
import structlog

logger = structlog.get_logger()


class NLPService:
    """
    NLP Layer - Understanding user text
    - Extract entities (dates, times, items, locations)
    - Detect urgency
    - Extract keywords
    - NO LLM, only pattern matching + spaCy
    """
    
    def __init__(self):
        self.spacy_models: Dict[str, Any] = {}
        self._load_models()
        
        # Urgency keywords per language
        self.urgency_keywords = {
            "en-GB": ["urgent", "asap", "emergency", "immediately", "today", "now", "quickly"],
            "de-DE": ["dringend", "sofort", "notfall", "heute", "jetzt", "schnell"],
            "fr-FR": ["urgent", "immédiatement", "urgence", "aujourd'hui", "maintenant", "vite"],
            "es-ES": ["urgente", "inmediatamente", "emergencia", "hoy", "ahora", "rápido"],
            "it-IT": ["urgente", "immediatamente", "emergenza", "oggi", "ora", "veloce"],
            "sv-SE": ["brådskande", "omedelbart", "akut", "idag", "nu", "snabbt"],
            "nb-NO": ["haster", "øyeblikkelig", "nødsituasjon", "idag", "nå", "raskt"],
            "da-DK": ["haster", "øjeblikkeligt", "nødsituation", "idag", "nu", "hurtigt"],
            "fi-FI": ["kiireellinen", "heti", "hätätilanne", "tänään", "nyt", "nopeasti"],
        }
        
        # Service-related keywords
        self.service_keywords = {
            "cleaning": ["clean", "cleaning", "wash", "mop", "vacuum", "dust"],
            "moving": ["move", "moving", "transport", "carry", "lift", "relocate"],
            "recycling": ["recycle", "waste", "trash", "garbage", "dispose", "remove"],
            "handyman": ["fix", "repair", "install", "mount", "assemble", "broken"],
            "gardening": ["garden", "lawn", "mow", "plant", "trim", "weed"],
            "delivery": ["deliver", "pickup", "fetch", "bring", "send"],
        }
    
    def _load_models(self):
        """Load spaCy models (lazy loading for efficiency)"""
        try:
            import spacy
            # Only load English model initially
            # Other languages loaded on demand
            self.spacy_models["en"] = spacy.load("en_core_web_sm")
            logger.info("✅ spaCy English model loaded")
        except Exception as e:
            logger.warning("spacy_load_warning", error=str(e), message="spaCy not installed, using fallback")
    
    def _get_spacy_model(self, language: str):
        """Get spaCy model for language (lazy loading)"""
        lang_code = language.split("-")[0]  # en-GB -> en
        
        if lang_code not in self.spacy_models:
            try:
                import spacy
                model_map = {
                    "en": "en_core_web_sm",
                    "de": "de_core_news_sm",
                    "fr": "fr_core_news_sm",
                    "es": "es_core_news_sm",
                    "it": "it_core_news_sm",
                    "sv": "sv_core_news_sm",
                    "nb": "nb_core_news_sm",
                    "da": "da_core_news_sm",
                    "fi": "fi_core_news_sm",
                }
                
                if lang_code in model_map:
                    self.spacy_models[lang_code] = spacy.load(model_map[lang_code])
                    logger.info(f"✅ spaCy {lang_code} model loaded")
                else:
                    # Fallback to English
                    return self.spacy_models.get("en")
            except Exception as e:
                logger.warning(f"spacy_model_load_failed", lang=lang_code, error=str(e))
                return self.spacy_models.get("en")
        
        return self.spacy_models.get(lang_code)
    
    def process(self, text: str, language: str = "en-GB") -> Dict[str, Any]:
        """
        Process user text and extract information
        
        Returns:
            {
                "entities": { "dates": [], "items": [], "locations": [] },
                "urgency": "high" | "medium" | "low",
                "keywords": [],
                "service_hints": []
            }
        """
        result = {
            "entities": {},
            "urgency": "medium",
            "keywords": [],
            "service_hints": []
        }
        
        # Extract entities with spaCy
        nlp = self._get_spacy_model(language)
        if nlp:
            doc = nlp(text)
            
            # Extract named entities
            result["entities"] = {
                "dates": [ent.text for ent in doc.ents if ent.label_ == "DATE"],
                "times": [ent.text for ent in doc.ents if ent.label_ == "TIME"],
                "locations": [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC"]],
                "items": [ent.text for ent in doc.ents if ent.label_ in ["PRODUCT", "ORG"]],
                "money": [ent.text for ent in doc.ents if ent.label_ == "MONEY"],
            }
            
            # Extract keywords (nouns + verbs)
            result["keywords"] = [
                token.lemma_.lower() 
                for token in doc 
                if token.pos_ in ["NOUN", "VERB"] and not token.is_stop
            ]
        else:
            # Fallback: simple tokenization
            result["keywords"] = [word.lower() for word in text.split() if len(word) > 3]
        
        # Detect urgency
        result["urgency"] = self._detect_urgency(text, language)
        
        # Detect service type hints
        result["service_hints"] = self._detect_service_hints(text)
        
        return result
    
    def _detect_urgency(self, text: str, language: str) -> str:
        """
        Detect urgency level
        - high: urgent keywords + near-future time references
        - medium: default
        - low: flexible keywords
        """
        text_lower = text.lower()
        
        # Get urgency keywords for language
        urgent_keywords = self.urgency_keywords.get(language, self.urgency_keywords["en-GB"])
        
        # Check for urgent keywords
        urgent_count = sum(1 for keyword in urgent_keywords if keyword in text_lower)
        
        if urgent_count >= 2:
            return "high"
        elif urgent_count == 1:
            return "high"
        
        # Check for flexible keywords
        flexible_keywords = ["whenever", "no rush", "flexible", "anytime", "soon"]
        if any(keyword in text_lower for keyword in flexible_keywords):
            return "low"
        
        return "medium"
    
    def _detect_service_hints(self, text: str) -> List[str]:
        """
        Detect which service categories are mentioned
        Returns list of service categories (e.g., ["cleaning", "moving"])
        """
        text_lower = text.lower()
        hints = []
        
        for service, keywords in self.service_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                hints.append(service)
        
        return hints
    
    def extract_items(self, text: str) -> List[str]:
        """
        Extract specific items mentioned (e.g., "sofa", "fridge", "boxes")
        Useful for recycling/moving services
        """
        # Common items in services
        common_items = [
            "sofa", "couch", "bed", "mattress", "table", "chair", "desk",
            "fridge", "refrigerator", "washing machine", "dryer", "dishwasher",
            "tv", "television", "computer", "monitor", "printer",
            "box", "boxes", "furniture", "appliance", "appliances"
        ]
        
        text_lower = text.lower()
        found_items = [item for item in common_items if item in text_lower]
        
        return found_items
    
    def detect_time_preference(self, text: str) -> Optional[str]:
        """
        Detect when user wants service
        Returns: "today" | "tomorrow" | "this_week" | "next_week" | "flexible" | None
        """
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["today", "now", "asap"]):
            return "today"
        elif any(word in text_lower for word in ["tomorrow"]):
            return "tomorrow"
        elif any(word in text_lower for word in ["this week", "within a week"]):
            return "this_week"
        elif any(word in text_lower for word in ["next week"]):
            return "next_week"
        elif any(word in text_lower for word in ["flexible", "anytime", "no rush"]):
            return "flexible"
        
        return None
