"""
Component 6: RESPONSE GENERATOR
Purpose: Convert decisions → structured text output (NO AI generation)
"""

import json
from typing import Dict, Optional
from pathlib import Path


class ResponseGenerator:
    """
    Template-based response generation.
    NO LLM, NO free-text generation.
    Simple, controlled, multilingual.
    """
    
    def __init__(self, templates_path: str = '../config/response_templates.json'):
        self.templates = self._load_templates(templates_path)
    
    def _load_templates(self, path: str) -> Dict:
        """Load response templates from JSON"""
        try:
            template_file = Path(__file__).parent.parent / 'config' / 'response_templates.json'
            with open(template_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Templates not found. Using fallback.")
            return self._get_fallback_templates()
    
    def _get_fallback_templates(self) -> Dict:
        """Fallback templates if file not found"""
        return {
            'en': {
                'greeting': 'Service booking ready.\n\nWhat do you need help with?',
                'ask_service': 'Which service?\n\n• Cleaning\n• Moving\n• Recycling\n• Repair\n• Other',
                'ask_location': '{{service}} selected ✔️\n\nWhere should it take place?',
                'ask_time': 'Location confirmed ✔️\n\nWhen do you need this?',
                'ask_description': 'Time confirmed ✔️\n\nDescribe what needs to be done:',
                'confirm': 'Booking summary:\n\n🔹 {{service}}\n📍 {{location}}\n🗓 {{time}}\n📝 {{description}}\n\nConfirm this request?',
                'fallback': 'I need one more detail.\n\nWhich service: Cleaning, Moving, or Other?',
            }
        }
    
    def generate(
        self,
        response_key: str,
        language: str = 'en',
        slots: Optional[Dict[str, str]] = None
    ) -> str:
        """
        Generate response from template.
        
        Args:
            response_key: Template key (e.g., 'ask_location')
            language: Language code ('en', 'de', 'sv', 'es')
            slots: Variables to fill (e.g., {'service': 'cleaning'})
        
        Returns:
            Formatted response string
        
        Example:
            generate('ask_location', 'en', {'service': 'cleaning'})
            → "cleaning selected ✔️\n\nWhere should it take place?"
        """
        # Get template
        template = self._get_template(response_key, language)
        
        # Fill slots
        if slots:
            response = self._fill_slots(template, slots)
        else:
            response = template
        
        return response
    
    def _get_template(self, key: str, language: str) -> str:
        """Get template for specific key and language"""
        # Try specific language
        if language in self.templates and key in self.templates[language]:
            return self.templates[language][key]
        
        # Fallback to English
        if 'en' in self.templates and key in self.templates['en']:
            return self.templates['en'][key]
        
        # Ultimate fallback
        return f"Response not available ({key})"
    
    def _fill_slots(self, template: str, slots: Dict[str, str]) -> str:
        """
        Fill template slots.
        
        Example:
            template: "{{service}} selected ✔️"
            slots: {'service': 'cleaning'}
            result: "cleaning selected ✔️"
        """
        result = template
        
        for key, value in slots.items():
            placeholder = f'{{{{{key}}}}}'  # {{key}}
            result = result.replace(placeholder, str(value))
        
        return result
    
    def generate_quick_replies(
        self,
        response_key: str,
        language: str = 'en'
    ) -> list[str]:
        """
        Generate quick reply options for specific response.
        
        Returns:
            List of button labels
        """
        quick_replies = {
            'ask_service': {
                'en': ['Cleaning', 'Moving', 'Recycling', 'Repair'],
                'de': ['Reinigung', 'Umzug', 'Recycling', 'Reparatur'],
                'sv': ['Städning', 'Flytt', 'Återvinning', 'Reparation'],
                'es': ['Limpieza', 'Mudanza', 'Reciclaje', 'Reparación'],
            },
            'ask_time': {
                'en': ['Today', 'Tomorrow', 'This week', 'Next week'],
                'de': ['Heute', 'Morgen', 'Diese Woche', 'Nächste Woche'],
                'sv': ['Idag', 'Imorgon', 'Denna vecka', 'Nästa vecka'],
                'es': ['Hoy', 'Mañana', 'Esta semana', 'Próxima semana'],
            },
            'confirm': {
                'en': ['Yes, create it', 'No, cancel'],
                'de': ['Ja, erstellen', 'Nein, abbrechen'],
                'sv': ['Ja, skapa', 'Nej, avbryt'],
                'es': ['Sí, crear', 'No, cancelar'],
            },
        }
        
        if response_key in quick_replies and language in quick_replies[response_key]:
            return quick_replies[response_key][language]
        
        return []
    
    def generate_error(self, language: str = 'en') -> str:
        """Generate error message"""
        return self._get_template('error', language)
    
    def generate_help(self, language: str = 'en') -> str:
        """Generate help message"""
        return self._get_template('help', language)


# Singleton instance
_generator = None

def get_generator() -> ResponseGenerator:
    """Get or create generator instance"""
    global _generator
    if _generator is None:
        _generator = ResponseGenerator()
    return _generator


# Example usage
if __name__ == "__main__":
    generator = ResponseGenerator()
    
    print("Response Generation Tests:")
    print("="*60)
    
    # Test 1: Simple template
    response = generator.generate('greeting', 'en')
    print(f"\nGreeting (EN):\n{response}")
    
    # Test 2: Template with slots
    response = generator.generate(
        'ask_location',
        'en',
        {'service': 'cleaning'}
    )
    print(f"\nAsk Location (EN):\n{response}")
    
    # Test 3: Confirmation with all slots
    response = generator.generate(
        'confirm',
        'de',
        {
            'service': 'Reinigung',
            'location': 'Berlin',
            'time': 'morgen',
            'description': 'Wohnung putzen'
        }
    )
    print(f"\nConfirm (DE):\n{response}")
    
    # Test 4: Quick replies
    replies = generator.generate_quick_replies('ask_service', 'sv')
    print(f"\nQuick Replies (SV):\n{replies}")
