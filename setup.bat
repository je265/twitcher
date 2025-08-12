@echo off
echo 🚀 TWITCHER PRO - Complete Setup Script
echo ======================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down -v >nul 2>&1

REM Build and start all services
echo 🔨 Building and starting all services...
docker-compose up --build -d

REM Wait for services
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Run database migrations
echo 🗃️ Setting up database schema...
docker-compose run --rm db-migrate

echo.
echo 🎉 TWITCHER PRO is now running!
echo ==============================
echo.
echo 📱 Web Interface:     http://localhost:3000
echo 🗃️ Database:          postgresql://twitch:twitch@localhost:5432/twitch
echo 🔄 Redis:             redis://localhost:6379
echo 💾 MinIO Console:     http://localhost:9001 (minio/minio123)
echo 💾 MinIO API:         http://localhost:9000
echo.
echo 🎯 Next Steps:
echo 1. Open http://localhost:3000
echo 2. Create an account (save your UUID!)
echo 3. Link your Twitch accounts
echo 4. Upload videos
echo 5. Start multi-account streaming!
echo.
echo 🛑 To stop: docker-compose down
echo 📊 To view logs: docker-compose logs -f
echo.
pause
