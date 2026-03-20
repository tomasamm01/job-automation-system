#!/bin/bash

# Start All Services
# Starts Backend, Frontend, and Scraper in separate terminals

echo "🚀 Starting Job Automation System"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if tmux is available
if command -v tmux &> /dev/null; then
    echo "Using tmux for session management..."
    
    # Create new tmux session
    SESSION="job-automation"
    
    # Kill existing session if it exists
    tmux kill-session -t $SESSION 2>/dev/null
    
    # Create new session with backend
    tmux new-session -d -s $SESSION -n backend
    tmux send-keys -t $SESSION:backend "cd backend/src/JobAutomation.WebAPI && dotnet run" C-m
    
    # Create window for frontend
    tmux new-window -t $SESSION -n frontend
    tmux send-keys -t $SESSION:frontend "cd frontend && npm run dev" C-m
    
    # Create window for scraper
    tmux new-window -t $SESSION -n scraper
    tmux send-keys -t $SESSION:scraper "cd scraper && npm run dev" C-m
    
    echo -e "${GREEN}✅ All services started in tmux session: $SESSION${NC}"
    echo ""
    echo "To attach to the session:"
    echo "  tmux attach -t $SESSION"
    echo ""
    echo "To switch between windows:"
    echo "  Ctrl+B then 0 (backend)"
    echo "  Ctrl+B then 1 (frontend)"
    echo "  Ctrl+B then 2 (scraper)"
    echo ""
    echo "To detach: Ctrl+B then D"
    echo "To kill session: tmux kill-session -t $SESSION"
    
else
    echo -e "${YELLOW}⚠️  tmux not found. Starting services in background...${NC}"
    echo ""
    
    # Start backend
    echo "📦 Starting Backend..."
    cd backend/src/JobAutomation.WebAPI
    dotnet run > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   PID: $BACKEND_PID"
    echo "   Logs: tail -f /tmp/backend.log"
    cd ../../..
    
    # Start frontend
    echo ""
    echo "🎨 Starting Frontend..."
    cd frontend
    npm run dev > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "   PID: $FRONTEND_PID"
    echo "   Logs: tail -f /tmp/frontend.log"
    cd ..
    
    # Start scraper
    echo ""
    echo "🕷️  Starting Scraper..."
    cd scraper
    npm run dev > /tmp/scraper.log 2>&1 &
    SCRAPER_PID=$!
    echo "   PID: $SCRAPER_PID"
    echo "   Logs: tail -f /tmp/scraper.log"
    cd ..
    
    # Save PIDs
    echo "$BACKEND_PID" > /tmp/job-automation.pids
    echo "$FRONTEND_PID" >> /tmp/job-automation.pids
    echo "$SCRAPER_PID" >> /tmp/job-automation.pids
    
    echo ""
    echo -e "${GREEN}✅ All services started${NC}"
    echo ""
    echo "To stop all services:"
    echo "  ./scripts/stop-all.sh"
    echo ""
    echo "Or manually:"
    echo "  kill $BACKEND_PID $FRONTEND_PID $SCRAPER_PID"
fi

echo ""
echo "🌐 Access points:"
echo "   Backend:  http://localhost:5000"
echo "   Swagger:  https://localhost:5001/swagger"
echo "   Frontend: http://localhost:5173"
echo ""
