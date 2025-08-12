#!/bin/bash

echo "🚀 TWITCHER PRO - Complete Setup Script"
echo "======================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is running"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down -v 2>/dev/null || true

# Build and start all services
echo "🔨 Building and starting all services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."

# Wait for database
echo "📊 Waiting for PostgreSQL..."
until docker-compose exec -T db pg_isready -U twitch > /dev/null 2>&1; do
    sleep 2
done

# Wait for Redis
echo "🔄 Waiting for Redis..."
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    sleep 2
done

# Wait for MinIO
echo "💾 Waiting for MinIO..."
until docker-compose exec -T minio curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do
    sleep 2
done

# Run database migrations
echo "🗃️ Setting up database schema..."
docker-compose run --rm db-migrate

echo ""
echo "🎉 TWITCHER PRO is now running!"
echo "=============================="
echo ""
echo "📱 Web Interface:     http://localhost:3000"
echo "🗃️ Database:          postgresql://twitch:twitch@localhost:5432/twitch"
echo "🔄 Redis:             redis://localhost:6379"
echo "💾 MinIO Console:     http://localhost:9001 (minio/minio123)"
echo "💾 MinIO API:         http://localhost:9000"
echo ""
echo "🎯 Next Steps:"
echo "1. Open http://localhost:3000"
echo "2. Create an account (save your UUID!)"
echo "3. Link your Twitch accounts"
echo "4. Upload videos"
echo "5. Start multi-account streaming!"
echo ""
echo "🛑 To stop: docker-compose down"
echo "📊 To view logs: docker-compose logs -f"
echo ""
