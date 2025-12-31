#!/bin/bash

# Helpro AI Service - Setup Script
# Sets up Python AI microservice with all dependencies

set -e

echo "🧠 Setting up Helpro AI Service..."
echo ""

# Check Python version
echo "📌 Checking Python version..."
python3 --version

if [ $? -ne 0 ]; then
    echo "❌ Python 3.11+ required but not found"
    exit 1
fi

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."
cd ai-service
python3 -m venv venv

# Activate virtual environment
echo ""
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Download spaCy models
echo ""
echo "🌍 Downloading spaCy language models..."
echo "   This may take a few minutes..."

# Core languages (Phase 1)
python -m spacy download en_core_web_sm  # English

# Phase 2 languages (optional, uncomment when needed)
# python -m spacy download de_core_news_sm  # German
# python -m spacy download fr_core_news_sm  # French
# python -m spacy download es_core_news_sm  # Spanish
# python -m spacy download it_core_news_sm  # Italian

# Phase 3 languages (optional, uncomment when needed)
# python -m spacy download sv_core_news_sm  # Swedish
# python -m spacy download nb_core_news_sm  # Norwegian
# python -m spacy download da_core_news_sm  # Danish
# python -m spacy download fi_core_news_sm  # Finnish

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p models
mkdir -p data
mkdir -p logs

# Create .env file if not exists
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Creating .env file..."
    cat > .env << EOF
# AI Service Configuration
AI_SERVICE_PORT=8000
AI_SERVICE_HOST=0.0.0.0

# Backend Integration
BACKEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=INFO

# Redis (optional)
# REDIS_URL=redis://localhost:6379
EOF
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the AI service:"
echo "   cd ai-service"
echo "   source venv/bin/activate"
echo "   uvicorn main:app --reload --port 8000"
echo ""
echo "📚 See README.md for API documentation"
echo ""
echo "🔗 Health check: http://localhost:8000/"
echo "📖 API docs: http://localhost:8000/docs"
