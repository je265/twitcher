@echo off
echo 🔧 Starting TWITCHER PRO Python Worker
echo ===================================

echo Setting environment variables...
set API_BASE=http://localhost:3000
set WORKER_TOKEN=twitcher-worker-secret-token
set WORKER_ID=local-worker-1

echo Environment check:
echo API_BASE=%API_BASE%
echo WORKER_TOKEN=%WORKER_TOKEN%
echo WORKER_ID=%WORKER_ID%

echo Starting Python worker...
cd apps\python-worker
python worker.py
