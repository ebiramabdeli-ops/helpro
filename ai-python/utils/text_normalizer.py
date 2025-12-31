"""
Component 1: INPUT NORMALIZATION
Purpose: Clean user text for consistent AI processing
"""

import re
import unicodedata


class TextNormalizer:
    """
    Normalize user input text for AI processing.
    NO LLM - Pure text cleaning.
    """

    @staticmethod
    def normalize(text: str) -> str:
        """
        Main normalization method.
        
        Input: " I need someone to clean my house tomorrow!! "
        Output: "i need someone to clean my house tomorrow"
        """
        if not text:
            return ""

        # 1. Unicode normalization (handle accents, special chars)
        text = unicodedata.normalize('NFKD', text)
        
        # 2. Lowercase
        text = text.lower()
        
        # 3. Remove extra whitespace
        text = text.strip()
        
        # 4. Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        # 5. Remove punctuation (keep letters, numbers, spaces)
        text = re.sub(r'[^\w\s]', '', text)
        
        return text

    @staticmethod
    def normalize_for_matching(text: str) -> str:
        """
        Normalize for keyword matching (more aggressive).
        Keeps only alphanumeric and spaces.
        """
        text = TextNormalizer.normalize(text)
        
        # Remove numbers (optional, for better keyword matching)
        # text = re.sub(r'\d+', '', text)
        
        return text

    @staticmethod
    def extract_keywords(text: str, min_length: int = 3) -> list[str]:
        """
        Extract keywords from text (for intent detection).
        
        Returns list of words >= min_length
        """
        normalized = TextNormalizer.normalize(text)
        words = normalized.split()
        
        # Filter short words
        keywords = [w for w in words if len(w) >= min_length]
        
        return keywords

    @staticmethod
    def clean_location(text: str) -> str:
        """
        Clean location strings specifically.
        Preserves capitalization for proper nouns.
        """
        text = text.strip()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove leading/trailing punctuation
        text = text.strip('.,;:!?')
        
        return text


# Example usage
if __name__ == "__main__":
    normalizer = TextNormalizer()
    
    # Test cases
    tests = [
        " I need someone to clean my house tomorrow!! ",
        "Hej! Jag behöver städning i Stockholm, Södermalm.",
        "Ich möchte morgen um 10:00 Uhr in Berlin putzen lassen.",
        "   Multiple    spaces   and   punctuation!!!   ",
    ]
    
    print("Text Normalization Tests:")
    for test in tests:
        normalized = normalizer.normalize(test)
        print(f"\nInput:  '{test}'")
        print(f"Output: '{normalized}'")
        print(f"Keywords: {normalizer.extract_keywords(test)}")
