"""
Configuration for multilingual AI support
15 languages (NO auto-translation)
"""
from typing import Dict, List

# Supported languages (same as frontend)
SUPPORTED_LANGUAGES = [
    "en-GB", "en-IE",  # English (UK, Ireland)
    "de-DE",           # German
    "fr-FR",           # French
    "es-ES",           # Spanish
    "it-IT",           # Italian
    "sv-SE",           # Swedish
    "nb-NO",           # Norwegian
    "da-DK",           # Danish
    "fi-FI",           # Finnish
    "nl-NL",           # Dutch
    "pt-PT",           # Portuguese
    "pl-PL",           # Polish
    "ro-RO",           # Romanian
    "el-GR",           # Greek
]

# Language code mapping (full locale → spaCy model)
SPACY_MODEL_MAP: Dict[str, str] = {
    "en-GB": "en_core_web_sm",
    "en-IE": "en_core_web_sm",
    "de-DE": "de_core_news_sm",
    "fr-FR": "fr_core_news_sm",
    "es-ES": "es_core_news_sm",
    "it-IT": "it_core_news_sm",
    "sv-SE": "sv_core_news_sm",
    "nb-NO": "nb_core_news_sm",
    "da-DK": "da_core_news_sm",
    "fi-FI": "fi_core_news_sm",
    "nl-NL": "nl_core_news_sm",
    "pt-PT": "pt_core_news_sm",
    # Note: spaCy doesn't have models for Polish, Romanian, Greek
    # These will fallback to English model
}

# Response templates per language
# IMPORTANT: These must be manually translated, NO auto-translation
RESPONSE_TEMPLATES: Dict[str, Dict[str, str]] = {
    # English (UK & Ireland)
    "en-GB": {
        "greeting": "Hi {name}! 👋 How can I help you today?",
        "booking_confirmed": "Great! Your {service} booking is confirmed for {time}.",
        "need_verification": "To book {service}, please complete identity verification.",
        "price_info": "{service} typically costs {price_range} for {duration}.",
        "complaint_escalate": "I'm sorry to hear that. Let me connect you with our support team.",
        "emergency_response": "This seems urgent. I'm prioritizing your request immediately.",
        "cancellation_confirmed": "Your booking has been cancelled. No fee applies.",
        "missing_info": "To get started, I need: {missing_items}.",
        "error": "I couldn't process that. Could you try rephrasing?",
    },
    
    # German
    "de-DE": {
        "greeting": "Hallo {name}! 👋 Wie kann ich dir heute helfen?",
        "booking_confirmed": "Super! Deine {service}-Buchung ist für {time} bestätigt.",
        "need_verification": "Um {service} zu buchen, vervollständige bitte die Identitätsprüfung.",
        "price_info": "{service} kostet normalerweise {price_range} für {duration}.",
        "complaint_escalate": "Das tut mir leid. Ich verbinde dich sofort mit unserem Support-Team.",
        "emergency_response": "Das scheint dringend. Ich priorisiere deine Anfrage sofort.",
        "cancellation_confirmed": "Deine Buchung wurde storniert. Es fallen keine Gebühren an.",
        "missing_info": "Um zu beginnen, benötige ich: {missing_items}.",
        "error": "Das konnte ich nicht verarbeiten. Kannst du es umformulieren?",
    },
    
    # French
    "fr-FR": {
        "greeting": "Bonjour {name}! 👋 Comment puis-je vous aider aujourd'hui?",
        "booking_confirmed": "Parfait! Votre réservation {service} est confirmée pour {time}.",
        "need_verification": "Pour réserver {service}, veuillez compléter la vérification d'identité.",
        "price_info": "{service} coûte généralement {price_range} pour {duration}.",
        "complaint_escalate": "Je suis désolé. Laissez-moi vous connecter avec notre équipe de support.",
        "emergency_response": "Cela semble urgent. Je priorise votre demande immédiatement.",
        "cancellation_confirmed": "Votre réservation a été annulée. Aucun frais ne s'applique.",
        "missing_info": "Pour commencer, j'ai besoin de: {missing_items}.",
        "error": "Je n'ai pas pu traiter cela. Pouvez-vous reformuler?",
    },
    
    # Spanish
    "es-ES": {
        "greeting": "¡Hola {name}! 👋 ¿Cómo puedo ayudarte hoy?",
        "booking_confirmed": "¡Genial! Tu reserva de {service} está confirmada para {time}.",
        "need_verification": "Para reservar {service}, completa la verificación de identidad.",
        "price_info": "{service} normalmente cuesta {price_range} por {duration}.",
        "complaint_escalate": "Lo siento mucho. Te conecto con nuestro equipo de soporte ahora.",
        "emergency_response": "Esto parece urgente. Estoy priorizando tu solicitud inmediatamente.",
        "cancellation_confirmed": "Tu reserva ha sido cancelada. No aplican cargos.",
        "missing_info": "Para empezar, necesito: {missing_items}.",
        "error": "No pude procesar eso. ¿Puedes reformularlo?",
    },
    
    # Italian
    "it-IT": {
        "greeting": "Ciao {name}! 👋 Come posso aiutarti oggi?",
        "booking_confirmed": "Ottimo! La tua prenotazione {service} è confermata per {time}.",
        "need_verification": "Per prenotare {service}, completa la verifica dell'identità.",
        "price_info": "{service} costa normalmente {price_range} per {duration}.",
        "complaint_escalate": "Mi dispiace. Ti connetto subito con il nostro team di supporto.",
        "emergency_response": "Sembra urgente. Sto dando priorità alla tua richiesta immediatamente.",
        "cancellation_confirmed": "La tua prenotazione è stata cancellata. Nessun costo applicato.",
        "missing_info": "Per iniziare, ho bisogno di: {missing_items}.",
        "error": "Non ho potuto elaborare questo. Puoi riformulare?",
    },
    
    # Swedish
    "sv-SE": {
        "greeting": "Hej {name}! 👋 Hur kan jag hjälpa dig idag?",
        "booking_confirmed": "Perfekt! Din {service}-bokning är bekräftad för {time}.",
        "need_verification": "För att boka {service}, slutför identitetsverifiering.",
        "price_info": "{service} kostar vanligtvis {price_range} för {duration}.",
        "complaint_escalate": "Jag är ledsen att höra det. Jag kopplar dig till vårt supportteam.",
        "emergency_response": "Det verkar brådskande. Jag prioriterar din förfrågan omedelbart.",
        "cancellation_confirmed": "Din bokning har avbokats. Ingen avgift tillkommer.",
        "missing_info": "För att komma igång behöver jag: {missing_items}.",
        "error": "Jag kunde inte behandla det. Kan du omformulera?",
    },
    
    # Norwegian
    "nb-NO": {
        "greeting": "Hei {name}! 👋 Hvordan kan jeg hjelpe deg i dag?",
        "booking_confirmed": "Flott! Din {service}-bestilling er bekreftet for {time}.",
        "need_verification": "For å bestille {service}, vennligst fullfør identitetsverifisering.",
        "price_info": "{service} koster vanligvis {price_range} for {duration}.",
        "complaint_escalate": "Beklager å høre det. Jeg kobler deg til vårt supportteam.",
        "emergency_response": "Dette virker haster. Jeg prioriterer forespørselen din øyeblikkelig.",
        "cancellation_confirmed": "Din bestilling er kansellert. Ingen gebyr gjelder.",
        "missing_info": "For å komme i gang trenger jeg: {missing_items}.",
        "error": "Jeg kunne ikke behandle det. Kan du omformulere?",
    },
}

# Shared English template for Ireland
RESPONSE_TEMPLATES["en-IE"] = RESPONSE_TEMPLATES["en-GB"]

# Default fallback language
DEFAULT_LANGUAGE = "en-GB"


def get_response_template(language: str, template_key: str) -> str:
    """
    Get response template for language
    Falls back to English if not found
    """
    # Normalize language
    if language not in SUPPORTED_LANGUAGES:
        language = DEFAULT_LANGUAGE
    
    templates = RESPONSE_TEMPLATES.get(language, RESPONSE_TEMPLATES[DEFAULT_LANGUAGE])
    return templates.get(template_key, templates["error"])


def format_response(language: str, template_key: str, **kwargs) -> str:
    """
    Format response template with variables
    
    Example:
        format_response("de-DE", "greeting", name="Max")
        → "Hallo Max! 👋 Wie kann ich dir heute helfen?"
    """
    template = get_response_template(language, template_key)
    
    try:
        return template.format(**kwargs)
    except KeyError as e:
        # Missing variable
        return template
