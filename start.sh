#!/bin/bash

# Esencelab - Start all services (Linux/Mac)
# Usage: ./start.sh

set -e

echo "========================================"
echo "  Starting Esencelab Development Stack"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed.${NC}"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}Python is required but not installed.${NC}"; exit 1; }

# Set default ports
FRONTEND_PORT=3000
BACKEND_PORT=3001
AI_PORT=3002

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        --backend-port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --ai-port)
            AI_PORT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: ./start.sh [options]"
            echo ""
            echo "Options:"
            echo "  --frontend-port PORT    Frontend port (default: 3000)"
            echo "  --backend-port PORT    Backend port (default: 3001)"
            echo "  --ai-port PORT         AI service port (default: 3002)"
            echo "  --help                 Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${YELLOW}Frontend:${NC} http://localhost:$FRONTEND_PORT"
echo -e "${YELLOW}Backend:${NC} http://localhost:$BACKEND_PORT/api"
echo -e "${YELLOW}AI Service:${NC} http://localhost:$AI_PORT"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $FRONTEND_PID $BACKEND_PID $AI_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Install dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..
fi

if [ ! -f "ai-service/venv/pyvenv.cfg" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    cd ai-service
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ../..
fi

echo -e "${GREEN}Starting services...${NC}"
echo ""

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start AI service
cd ai-service
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port $AI_PORT &
AI_PID=$!
cd ..

echo -e "${GREEN}All services started!${NC}"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all processes
wait