@echo off
echo 🧪 Quick Worker System Test
echo ==========================

echo 1. Testing API availability...
curl http://localhost:3002/api/test/worker

echo.
echo 2. Testing Worker Auth...
curl -H "Authorization: Bearer twitcher-worker-secret-token" http://localhost:3002/api/worker/next

echo.
echo 3. Environment Status:
echo WORKER_TOKEN: %WORKER_TOKEN%
echo API_BASE: %API_BASE%

pause
