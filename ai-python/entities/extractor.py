"""
Entity Extraction Module
Extracts structured information from text:
- Service type
- Date/Time
- Location
- Urgency
NO transformers, NO embeddings - just regex + dateparser
"""

import re
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import dateparser

class EntityExtractor:
    """
    Rule-based entity extraction
    Fast, deterministic, multilingual
    """
    
    # Service type keywords
    SERVICE_KEYWORDS = {
        'cleaning': ['clean', 'cleaning', 'reinigung', 'putzen', 'städa', 'städning', 'limpieza'],
        'moving': ['move', 'moving', 'transport', 'umzug', 'flytt', 'flyttning', 'mudanza'],
        'recycling': ['recycle', 'trash', 'garbage', 'müll', 'återvinning', 'reciclaje'],
        'repair': ['repair', 'fix', 'reparatur', 'reparera', 'reparación'],
        'gardening': ['garden', 'lawn', 'garten', 'trädgård', 'jardinería'],
        'shopping': ['shop', 'grocery', 'einkauf', 'handla', 'compras'],
        'assembly': ['assemble', 'assembly', 'furniture', 'montage', 'montera', 'montaje'],
        'painting': ['paint', 'painting', 'malen', 'måla', 'pintura']
    }
    
    # Urgency keywords
    URGENCY_KEYWORDS = {
        'urgent': ['urgent', 'asap', 'now', 'immediately', 'dringend', 'sofort', 'akut', 'omedelbart', 'urgente'],
        'flexible': ['flexible', 'whenever', 'no rush', 'flexibel', 'wann immer', 'flexibel']
    }
    
    # Time patterns (relative)
    TIME_PATTERNS = {
        'today': ['today', 'heute', 'idag', 'hoy'],
        'tomorrow': ['tomorrow', 'morgen', 'imorgon', 'mañana'],
        'this_week': ['this week', 'diese woche', 'denna vecka', 'esta semana'],
        'next_week': ['next week', 'nächste woche', 'nästa vecka', 'próxima semana'],
        'weekend': ['weekend', 'wochenende', 'helg', 'fin de semana']
    }
    
    def __init__(self):
        self.dateparser_settings = {
            'PREFER_DATES_FROM': 'future',
            'RELATIVE_BASE': datetime.now()
        }
    
    def extract_service(self, text: str) -> Optional[str]:
        """Extract service type from text"""
        text_lower = text.lower()
        
        for service, keywords in self.SERVICE_KEYWORDS.items():
            if any(keyword in text_lower for keyword in keywords):
                return service
        
        return None
    
    def extract_urgency(self, text: str) -> Optional[str]:
        """Extract urgency level"""
        text_lower = text.lower()
        
        for urgency, keywords in self.URGENCY_KEYWORDS.items():
            if any(keyword in text_lower for keyword in keywords):
                return urgency
        
        return None
    
    def extract_time(self, text: str) -> Optional[Dict[str, any]]:
        """
        Extract time information
        Returns dict with:
        - raw: original text
        - parsed: ISO datetime string (if absolute)
        - relative: relative time string (if relative)
        """
        text_lower = text.lower()
        
        # Check relative time patterns
        for time_key, patterns in self.TIME_PATTERNS.items():
            if any(pattern in text_lower for pattern in patterns):
                # Calculate absolute date
                if time_key == 'today':
                    parsed_date = datetime.now().date()
                elif time_key == 'tomorrow':
                    parsed_date = (datetime.now() + timedelta(days=1)).date()
                elif time_key == 'this_week':
                    parsed_date = datetime.now().date()
                elif time_key == 'next_week':
                    parsed_date = (datetime.now() + timedelta(days=7)).date()
                elif time_key == 'weekend':
                    # Next Saturday
                    days_ahead = 5 - datetime.now().weekday()  # Saturday = 5
                    if days_ahead <= 0:
                        days_ahead += 7
                    parsed_date = (datetime.now() + timedelta(days=days_ahead)).date()
                else:
                    parsed_date = None
                
                return {
                    'raw': text,
                    'relative': time_key,
                    'parsed': parsed_date.isoformat() if parsed_date else None
                }
        
        # Try parsing with dateparser (for absolute dates like "January 15")
        parsed = dateparser.parse(text, settings=self.dateparser_settings)
        if parsed:
            return {
                'raw': text,
                'parsed': parsed.date().isoformat(),
                'relative': None
            }
        
        return None
    
    def extract_location(self, text: str) -> Optional[str]:
        """
        Extract location from text
        Simple pattern matching for "in/at/near <location>"
        """
        # Patterns for different languages
        patterns = [
            r'\b(?:in|at|near)\s+([A-Z][a-zA-Z\s]+)',  # English
            r'\b(?:in|bei|in der nähe von)\s+([A-Z][a-zA-Z\s]+)',  # German
            r'\b(?:i|vid|nära)\s+([A-Z][a-zA-ZåäöÅÄÖ\s]+)',  # Swedish
            r'\b(?:en|cerca de)\s+([A-Z][a-zA-Z\s]+)',  # Spanish
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                location = match.group(1).strip()
                # Limit to 3 words
                words = location.split()[:3]
                return ' '.join(words)
        
        # Try to find capitalized words (city names)
        capitalized = re.findall(r'\b[A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)*', text)
        if capitalized:
            return capitalized[0]
        
        return None
    
    def extract_budget(self, text: str) -> Optional[Dict[str, float]]:
        """
        Extract budget information
        Looks for patterns like "€100", "100 euro", "50-100€"
        """
        # Pattern for currency amounts
        patterns = [
            r'€\s*(\d+)(?:\s*-\s*(\d+))?',  # €100 or €50-100
            r'(\d+)\s*(?:euro|eur)(?:\s*-\s*(\d+))?',  # 100 euro
            r'(\d+)\s*kr(?:\s*-\s*(\d+))?',  # 100 kr (Swedish)
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                min_budget = float(match.group(1))
                max_budget = float(match.group(2)) if match.group(2) else min_budget * 1.5
                
                return {
                    'min': min_budget,
                    'max': max_budget
                }
        
        return None
    
    def extract_all(self, text: str) -> Dict[str, any]:
        """
        Extract all entities from text
        Main API method
        """
        return {
            'service': self.extract_service(text),
            'urgency': self.extract_urgency(text),
            'time': self.extract_time(text),
            'location': self.extract_location(text),
            'budget': self.extract_budget(text)
        }


# Singleton instance
_extractor = None

def get_extractor() -> EntityExtractor:
    """Get or create extractor instance"""
    global _extractor
    if _extractor is None:
        _extractor = EntityExtractor()
    return _extractor
