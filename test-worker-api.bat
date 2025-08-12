@echo off
echo Testing Worker API Connection...

curl -X GET "http://localhost:3000/api/worker/next" -H "Authorization: Bearer twitcher-worker-secret-token" -v

pause
