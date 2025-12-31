"""
Training script for intent classifier
Run offline to train/update the model
"""

from classifier import IntentClassifier

# Training data (expand with real data later)
TRAINING_DATA = [
    # REQUEST_SERVICE
    ("I need help cleaning my apartment", "REQUEST_SERVICE"),
    ("Looking for someone to help with moving", "REQUEST_SERVICE"),
    ("Need assistance with recycling", "REQUEST_SERVICE"),
    ("Can you help me repair my bike", "REQUEST_SERVICE"),
    ("Ich brauche Hilfe beim Umzug", "REQUEST_SERVICE"),
    ("Jag behöver hjälp med städning", "REQUEST_SERVICE"),
    
    # ASK_PRICE
    ("How much does cleaning cost", "ASK_PRICE"),
    ("What is the price for moving", "ASK_PRICE"),
    ("Cost estimate please", "ASK_PRICE"),
    ("Was kostet eine Reinigung", "ASK_PRICE"),
    ("Hur mycket kostar det", "ASK_PRICE"),
    
    # ASK_AVAILABILITY
    ("Are you available tomorrow", "ASK_AVAILABILITY"),
    ("When can you do this", "ASK_AVAILABILITY"),
    ("Is anyone free today", "ASK_AVAILABILITY"),
    ("Wann seid ihr verfügbar", "ASK_AVAILABILITY"),
    
    # CANCEL_REQUEST
    ("I want to cancel my request", "CANCEL_REQUEST"),
    ("Cancel this please", "CANCEL_REQUEST"),
    ("Abort the service", "CANCEL_REQUEST"),
    ("Ich möchte stornieren", "CANCEL_REQUEST"),
    
    # ASK_STATUS
    ("What is the status of my request", "ASK_STATUS"),
    ("Any updates", "ASK_STATUS"),
    ("How is it going", "ASK_STATUS"),
    
    # GREETING
    ("Hello", "GREETING"),
    ("Hi there", "GREETING"),
    ("Hey", "GREETING"),
    ("Hallo", "GREETING"),
    ("Hej", "GREETING"),
    
    # HELP
    ("How does this work", "HELP"),
    ("I need help", "HELP"),
    ("What can you do", "HELP"),
    ("Wie funktioniert das", "HELP"),
]

def train_model():
    """Train and save intent classifier"""
    texts = [text for text, _ in TRAINING_DATA]
    labels = [label for _, label in TRAINING_DATA]
    
    classifier = IntentClassifier()
    classifier.train(texts, labels)
    classifier.save()
    
    # Test
    print("\n--- Testing classifier ---")
    test_cases = [
        "I need help with cleaning",
        "How much will it cost",
        "Are you available",
        "Cancel my request",
    ]
    
    for test in test_cases:
        result = classifier.classify(test)
        print(f"{test} → {result['intent']} ({result['confidence']:.2f}, {result['method']})")

if __name__ == "__main__":
    train_model()
