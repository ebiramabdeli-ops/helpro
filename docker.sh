#!/bin/bash

# Helpro Docker Startup Script

set -e

COMMAND=${1:-help}

case "$COMMAND" in
  start)
    echo "🚀 Starting Helpro in Production mode..."
    docker-compose up -d
    echo ""
    echo "✅ Services started!"
    echo ""
    echo "📱 Frontend: http://localhost"
    echo "🔧 Backend API: http://localhost:3000"
    echo "🛠️  Server API: http://localhost:8080"
    echo "🤖 AI Service: http://localhost:8000"
    echo ""
    echo "View logs: docker-compose logs -f"
    ;;

  dev)
    echo "🚀 Starting Helpro in Development mode..."
    docker-compose -f docker-compose.dev.yml up -d
    echo ""
    echo "✅ Services started with hot reload!"
    echo ""
    echo "📱 Frontend: http://localhost:5173"
    echo "🔧 Backend API: http://localhost:3000"
    echo "🛠️  Server API: http://localhost:8080"
    echo "🤖 AI Service: http://localhost:8000"
    echo ""
    echo "View logs: docker-compose -f docker-compose.dev.yml logs -f"
    ;;

  stop)
    echo "🛑 Stopping Helpro services..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    echo "✅ Services stopped"
    ;;

  restart)
    echo "♻️  Restarting Helpro services..."
    docker-compose restart
    echo "✅ Services restarted"
    ;;

  logs)
    echo "📋 Showing logs (Ctrl+C to exit)..."
    docker-compose logs -f
    ;;

  logs-dev)
    echo "📋 Showing development logs (Ctrl+C to exit)..."
    docker-compose -f docker-compose.dev.yml logs -f
    ;;

  build)
    echo "🔨 Building all services..."
    docker-compose build
    echo "✅ Build complete"
    ;;

  rebuild)
    echo "🔨 Rebuilding all services (no cache)..."
    docker-compose build --no-cache
    echo "✅ Rebuild complete"
    ;;

  clean)
    echo "🧹 Cleaning up Docker resources..."
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
    echo "🗑️  Removing unused images..."
    docker image prune -f
    echo "✅ Cleanup complete"
    ;;

  status)
    echo "📊 Service Status:"
    docker-compose ps
    ;;

  shell-backend)
    echo "🐚 Opening shell in backend container..."
    docker-compose exec backend sh
    ;;

  shell-frontend)
    echo "🐚 Opening shell in frontend container..."
    docker-compose exec frontend sh
    ;;

  shell-db)
    echo "🐚 Opening PostgreSQL shell..."
    docker-compose exec postgres psql -U helpro
    ;;

  backup-db)
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    echo "💾 Creating database backup: $BACKUP_FILE"
    docker-compose exec -T postgres pg_dump -U helpro helpro > "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
    ;;

  help|*)
    echo "Helpro Docker Management Script"
    echo ""
    echo "Usage: ./docker.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start          Start services in production mode"
    echo "  dev            Start services in development mode (with hot reload)"
    echo "  stop           Stop all services"
    echo "  restart        Restart all services"
    echo "  logs           Show production logs"
    echo "  logs-dev       Show development logs"
    echo "  build          Build all Docker images"
    echo "  rebuild        Rebuild all images (no cache)"
    echo "  clean          Stop services and remove volumes"
    echo "  status         Show status of all services"
    echo "  shell-backend  Open shell in backend container"
    echo "  shell-frontend Open shell in frontend container"
    echo "  shell-db       Open PostgreSQL shell"
    echo "  backup-db      Create database backup"
    echo "  help           Show this help message"
    echo ""
    ;;
esac
