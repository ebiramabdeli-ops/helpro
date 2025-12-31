@echo off
REM Helpro AI Service - Setup Script (Windows)
REM Sets up Python AI microservice with all dependencies

echo 🧠 Setting up Helpro AI Service...
echo.

REM Check Python version
echo 📌 Checking Python version...
python --version

if %errorlevel% neq 0 (
    echo ❌ Python 3.11+ required but not found
    exit /b 1
)

REM Create virtual environment
echo.
echo 📦 Creating virtual environment...
cd ai-service
python -m venv venv

REM Activate virtual environment
echo.
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo.
echo ⬆️  Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo.
echo 📥 Installing Python dependencies...
pip install -r requirements.txt

REM Download spaCy models
echo.
echo 🌍 Downloading spaCy language models...
echo    This may take a few minutes...

REM Core languages (Phase 1)
python -m spacy download en_core_web_sm

REM Phase 2 languages (optional, uncomment when needed)
REM python -m spacy download de_core_news_sm
REM python -m spacy download fr_core_news_sm
REM python -m spacy download es_core_news_sm
REM python -m spacy download it_core_news_sm

REM Create necessary directories
echo.
echo 📁 Creating directories...
if not exist models mkdir models
if not exist data mkdir data
if not exist logs mkdir logs

REM Create .env file if not exists
if not exist .env (
    echo.
    echo ⚙️  Creating .env file...
    (
        echo # AI Service Configuration
        echo AI_SERVICE_PORT=8000
        echo AI_SERVICE_HOST=0.0.0.0
        echo.
        echo # Backend Integration
        echo BACKEND_URL=http://localhost:3000
        echo.
        echo # Logging
        echo LOG_LEVEL=INFO
        echo.
        echo # Redis ^(optional^)
        echo # REDIS_URL=redis://localhost:6379
    ) > .env
)

echo.
echo ✅ Setup complete!
echo.
echo 🚀 To start the AI service:
echo    cd ai-service
echo    venv\Scripts\activate
echo    uvicorn main:app --reload --port 8000
echo.
echo 📚 See README.md for API documentation
echo.
echo 🔗 Health check: http://localhost:8000/
echo 📖 API docs: http://localhost:8000/docs

pause
