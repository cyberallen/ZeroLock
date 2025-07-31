#!/bin/bash

echo " Stopping ZeroLock project..."

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stop frontend development server
stop_frontend() {
    echo -e "${BLUE} Stopping frontend development server...${NC}"
    
    # Find and stop Vite processes
    VITE_PIDS=$(pgrep -f "vite" 2>/dev/null || true)
    if [ ! -z "$VITE_PIDS" ]; then
        echo -e "${YELLOW} Found running Vite processes: $VITE_PIDS${NC}"
        echo $VITE_PIDS | xargs kill -TERM 2>/dev/null || true
        sleep 2
        
        # Force stop remaining processes
        REMAINING_PIDS=$(pgrep -f "vite" 2>/dev/null || true)
        if [ ! -z "$REMAINING_PIDS" ]; then
            echo -e "${RED} Force stopping remaining processes: $REMAINING_PIDS${NC}"
            echo $REMAINING_PIDS | xargs kill -KILL 2>/dev/null || true
        fi
        
        echo -e "${GREEN} Frontend server stopped${NC}"
    else
        echo -e "${GREEN} Frontend server not running${NC}"
    fi
    
    # Stop possible Node.js development server
    NODE_DEV_PIDS=$(pgrep -f "node.*dev" 2>/dev/null || true)
    if [ ! -z "$NODE_DEV_PIDS" ]; then
        echo -e "${YELLOW} Stopping Node.js development processes: $NODE_DEV_PIDS${NC}"
        echo $NODE_DEV_PIDS | xargs kill -TERM 2>/dev/null || true
    fi
}

# Stop Internet Computer network
stop_ic_network() {
    echo -e "${BLUE} Stopping Internet Computer network...${NC}"
    
    # Check if dfx is running
    if dfx ping > /dev/null 2>&1; then
        echo -e "${YELLOW} Stopping DFX network...${NC}"
        dfx stop
        echo -e "${GREEN} DFX network stopped${NC}"
    else
        echo -e "${GREEN} DFX network not running${NC}"
    fi
}

# Cleanup DFX processes
cleanup_dfx_processes() {
    echo -e "${BLUE} Cleaning up DFX related processes...${NC}"
    
    # Use dfx killall to cleanup
    dfx killall 2>/dev/null || true
    
    # Manually cleanup possible remaining dfx processes
    DFX_PIDS=$(pgrep -f "dfx" 2>/dev/null || true)
    if [ ! -z "$DFX_PIDS" ]; then
        echo -e "${YELLOW} Cleaning up remaining DFX processes: $DFX_PIDS${NC}"
        echo $DFX_PIDS | xargs kill -TERM 2>/dev/null || true
        sleep 2
        
        # Force cleanup
        REMAINING_DFX_PIDS=$(pgrep -f "dfx" 2>/dev/null || true)
        if [ ! -z "$REMAINING_DFX_PIDS" ]; then
            echo -e "${RED} Force cleaning DFX processes: $REMAINING_DFX_PIDS${NC}"
            echo $REMAINING_DFX_PIDS | xargs kill -KILL 2>/dev/null || true
        fi
    fi
    
    # Cleanup IC related processes
    IC_PIDS=$(pgrep -f "ic-starter\|replica\|canister_sandbox" 2>/dev/null || true)
    if [ ! -z "$IC_PIDS" ]; then
        echo -e "${YELLOW} Cleaning up IC related processes: $IC_PIDS${NC}"
        echo $IC_PIDS | xargs kill -TERM 2>/dev/null || true
        sleep 1
        
        # Force cleanup
        REMAINING_IC_PIDS=$(pgrep -f "ic-starter\|replica\|canister_sandbox" 2>/dev/null || true)
        if [ ! -z "$REMAINING_IC_PIDS" ]; then
            echo -e "${RED} Force cleaning IC processes: $REMAINING_IC_PIDS${NC}"
            echo $REMAINING_IC_PIDS | xargs kill -KILL 2>/dev/null || true
        fi
    fi
    
    echo -e "${GREEN} Process cleanup completed${NC}"
}

# Check port usage
check_ports() {
    echo -e "${BLUE} Checking port usage...${NC}"
    
    # Check common ports
    PORTS=("3000" "3001" "4943" "8000" "8080")
    
    for port in "${PORTS[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            PID=$(lsof -Pi :$port -sTCP:LISTEN -t)
            PROCESS=$(ps -p $PID -o comm= 2>/dev/null || echo "unknown")
            echo -e "${YELLOW} Port $port still occupied (PID: $PID, Process: $PROCESS)${NC}"
        fi
    done
}

# Cleanup temporary files
cleanup_temp_files() {
    echo -e "${BLUE} Cleaning up temporary files...${NC}"
    
    # Cleanup .dfx temporary files (keep configuration)
    if [ -d ".dfx/local" ]; then
        echo -e "${YELLOW} Cleaning up .dfx/local directory...${NC}"
        rm -rf .dfx/local/replica.log* 2>/dev/null || true
    fi
    
    # Cleanup frontend temporary files
    if [ -d "frontend" ]; then
        rm -rf frontend/.vite 2>/dev/null || true
        rm -rf frontend/dist/.vite 2>/dev/null || true
    fi
    
    echo -e "${GREEN} Temporary files cleanup completed${NC}"
}

# Show stop status
show_status() {
    echo -e "${BLUE} Current status:${NC}"
    
    # Check DFX status
    if dfx ping > /dev/null 2>&1; then
        echo -e "   DFX: ${RED}Still running${NC}"
    else
        echo -e "   DFX: ${GREEN}Stopped${NC}"
    fi
    
    # Check frontend server
    if pgrep -f "vite" > /dev/null 2>&1; then
        echo -e "   Frontend: ${RED}Still running${NC}"
    else
        echo -e "   Frontend: ${GREEN}Stopped${NC}"
    fi
    
    # Check ports
    if lsof -Pi :4943 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "   Port 4943: ${RED}Occupied${NC}"
    else
        echo -e "   Port 4943: ${GREEN}Free${NC}"
    fi
    
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "   Port 3000: ${RED}Occupied${NC}"
    else
        echo -e "   Port 3000: ${GREEN}Free${NC}"
    fi
}

# Main function
main() {
    echo -e "${GREEN} ZeroLock Project Stop Script${NC}"
    echo -e "${BLUE}===========================================${NC}"
    
    stop_frontend
    stop_ic_network
    cleanup_dfx_processes
    cleanup_temp_files
    
    echo -e "${BLUE}===========================================${NC}"
    show_status
    echo -e "${BLUE}===========================================${NC}"
    
    check_ports
    
    echo -e "${GREEN} ZeroLock project completely stopped${NC}"
    echo -e "${BLUE} Tip: If ports are still occupied, you can manually stop related processes${NC}"
}

# Force cleanup option
if [ "$1" = "--force" ] || [ "$1" = "-f" ]; then
    echo -e "${RED} Force cleanup mode${NC}"
    
    # Force stop all related processes
    pkill -f "vite" 2>/dev/null || true
    pkill -f "dfx" 2>/dev/null || true
    pkill -f "ic-starter" 2>/dev/null || true
    pkill -f "replica" 2>/dev/null || true
    pkill -f "canister_sandbox" 2>/dev/null || true
    
    # Force cleanup ports
    for port in 3000 3001 4943; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            PID=$(lsof -Pi :$port -sTCP:LISTEN -t)
            echo -e "${RED} Force stopping process occupying port $port (PID: $PID)${NC}"
            kill -KILL $PID 2>/dev/null || true
        fi
    done
    
    # Cleanup all temporary files
    rm -rf .dfx/local 2>/dev/null || true
    rm -rf frontend/.vite 2>/dev/null || true
    rm -rf frontend/dist 2>/dev/null || true
    
    echo -e "${GREEN} Force cleanup completed${NC}"
else
    # Normal stop process
    main
fi

echo -e "${BLUE} Use './stop.sh --force' for force cleanup${NC}"