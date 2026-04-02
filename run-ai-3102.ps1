$env:AI_ALLOWED_ORIGINS='http://127.0.0.1:3100,http://localhost:3100,http://127.0.0.1:3101'
$env:AI_INTERNAL_AUTH_TOKEN='test-internal-token-1234567890'
python -m uvicorn app.main:app --host 127.0.0.1 --port 3102
