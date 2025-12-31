.PHONY: help start dev stop restart logs logs-dev build rebuild clean status shell-backend shell-frontend shell-db backup-db

help: ## Zeige diese Hilfe
	@echo "Helpro Docker Management"
	@echo ""
	@echo "Verfügbare Befehle:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

start: ## Starte Services in Production Mode
	@echo "🚀 Starting Helpro in Production mode..."
	docker-compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "📱 Frontend: http://localhost"
	@echo "🔧 Backend API: http://localhost:3000"
	@echo "🛠️  Server API: http://localhost:8080"
	@echo "🤖 AI Service: http://localhost:8000"

dev: ## Starte Services in Development Mode (mit Hot Reload)
	@echo "🚀 Starting Helpro in Development mode..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "✅ Services started with hot reload!"
	@echo "📱 Frontend: http://localhost:5173"
	@echo "🔧 Backend API: http://localhost:3000"
	@echo "🛠️  Server API: http://localhost:8080"
	@echo "🤖 AI Service: http://localhost:8000"

stop: ## Stoppe alle Services
	@echo "🛑 Stopping Helpro services..."
	docker-compose down
	-docker-compose -f docker-compose.dev.yml down 2>/dev/null
	@echo "✅ Services stopped"

restart: ## Starte Services neu
	@echo "♻️  Restarting Helpro services..."
	docker-compose restart
	@echo "✅ Services restarted"

logs: ## Zeige Production Logs
	@echo "📋 Showing logs (Ctrl+C to exit)..."
	docker-compose logs -f

logs-dev: ## Zeige Development Logs
	@echo "📋 Showing development logs (Ctrl+C to exit)..."
	docker-compose -f docker-compose.dev.yml logs -f

build: ## Baue alle Services
	@echo "🔨 Building all services..."
	docker-compose build
	@echo "✅ Build complete"

rebuild: ## Baue alle Services neu (ohne Cache)
	@echo "🔨 Rebuilding all services (no cache)..."
	docker-compose build --no-cache
	@echo "✅ Rebuild complete"

clean: ## Bereinige Docker-Ressourcen
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v
	-docker-compose -f docker-compose.dev.yml down -v 2>/dev/null
	@echo "🗑️  Removing unused images..."
	docker image prune -f
	@echo "✅ Cleanup complete"

status: ## Zeige Service Status
	@echo "📊 Service Status:"
	docker-compose ps

shell-backend: ## Öffne Shell im Backend Container
	@echo "🐚 Opening shell in backend container..."
	docker-compose exec backend sh

shell-frontend: ## Öffne Shell im Frontend Container
	@echo "🐚 Opening shell in frontend container..."
	docker-compose exec frontend sh

shell-db: ## Öffne PostgreSQL Shell
	@echo "🐚 Opening PostgreSQL shell..."
	docker-compose exec postgres psql -U helpro

backup-db: ## Erstelle Database Backup
	@echo "💾 Creating database backup..."
	@BACKUP_FILE="backup-$$(date +%Y%m%d-%H%M%S).sql" && \
	docker-compose exec -T postgres pg_dump -U helpro helpro > "$$BACKUP_FILE" && \
	echo "✅ Backup created: $$BACKUP_FILE"
