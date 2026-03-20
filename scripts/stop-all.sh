#!/bin/bash

# Stop All Services

echo "🛑 Stopping Job Automation System"
echo "=================================="

# Check if tmux session exists
if tmux has-session -t job-automation 2>/dev/null; then
    echo "Killing tmux session..."
    tmux kill-session -t job-automation
    echo "✅ Tmux session killed"
else
    # Stop services by PID
    if [ -f /tmp/job-automation.pids ]; then
        echo "Stopping services..."
        while read pid; do
            if ps -p $pid > /dev/null 2>&1; then
                kill $pid
                echo "  Killed process $pid"
            fi
        done < /tmp/job-automation.pids
        rm /tmp/job-automation.pids
        echo "✅ All services stopped"
    else
        echo "⚠️  No running services found"
        echo ""
        echo "Searching for processes..."
        
        # Find and kill dotnet processes
        DOTNET_PIDS=$(pgrep -f "JobAutomation.WebAPI")
        if [ ! -z "$DOTNET_PIDS" ]; then
            echo "  Killing backend: $DOTNET_PIDS"
            kill $DOTNET_PIDS
        fi
        
        # Find and kill node processes
        NODE_PIDS=$(pgrep -f "vite|tsx")
        if [ ! -z "$NODE_PIDS" ]; then
            echo "  Killing frontend/scraper: $NODE_PIDS"
            kill $NODE_PIDS
        fi
    fi
fi

echo ""
echo "✅ Cleanup complete"
