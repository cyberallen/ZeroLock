#!/bin/bash

echo " ZeroLock Project Debug Tool"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Show help information
show_help() {
    echo -e "${BLUE} ZeroLock Debug Tool Usage${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo -e "Usage: ./debug.sh [options]"
    echo -e ""
    echo -e "Options:"
    echo -e "  --env, -e        Check environment configuration"
    echo -e "  --canisters, -c  Check Canister status"
    echo -e "  --network, -n    Check network connectivity"
    echo -e "  --frontend, -f   Check frontend status"
    echo -e "  --logs, -l       View logs"
    echo -e "  --ports, -p      Check port usage"
    echo -e "  --all, -a        Run all checks"
    echo -e "  --fix            Try to auto-fix common issues"
    echo -e "  --reset          Reset project to initial state"
    echo -e "  --help, -h       Show this help information"
    echo -e ""
    echo -e "Examples:"
    echo -e "  ./debug.sh --all          # Run all checks"
    echo -e "  ./debug.sh --canisters    # Only check Canister status"
    echo -e "  ./debug.sh --fix          # Try to auto-fix issues"
}

# Check environment configuration
check_environment() {
    echo -e "${BLUE} Checking environment configuration...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    # Check required tools
    echo -e "${PURPLE} Required tools check:${NC}"
    
    tools=("dfx" "cargo" "rustc" "node" "npm")
    for tool in "${tools[@]}"; do
        if command -v $tool &> /dev/null; then
            version=$($tool --version 2>/dev/null | head -n1 || echo "Unknown version")
            echo -e "   $tool: ${GREEN}$version${NC}"
        else
            echo -e "   $tool: ${RED}Not installed${NC}"
        fi
    done
    
    echo -e ""
    
    # Check environment variables
    echo -e "${PURPLE} Environment variables check:${NC}"
    
    if [ -f "frontend/.env" ]; then
        echo -e "   Environment file: ${GREEN}Exists${NC}"
        echo -e "${YELLOW}   Environment variables content:${NC}"
        while IFS= read -r line; do
            if [[ $line =~ ^[A-Z] ]]; then
                echo -e "    $line"
            fi
        done < frontend/.env
    else
        echo -e "   Environment file: ${RED}Does not exist${NC}"
    fi
    
    echo -e ""
    
    # Check project files
    echo -e "${PURPLE} Project files check:${NC}"
    
    files=("dfx.json" "Cargo.toml" "frontend/package.json" "src/lib.rs")
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "   $file: ${GREEN}Exists${NC}"
        else
            echo -e "   $file: ${RED}Missing${NC}"
        fi
    done
    
    echo -e ""
}

# Check Canister status
check_canisters() {
    echo -e "${BLUE} Checking Canister status...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    # Check DFX network
    if ! dfx ping > /dev/null 2>&1; then
        echo -e "   DFX network: ${RED}Not running${NC}"
        echo -e "   Tip: Run 'dfx start --background' to start the network"
        return 1
    else
        echo -e "   DFX network: ${GREEN}Running${NC}"
    fi
    
    echo -e ""
    
    # Check each Canister
    canisters=("zerolock_backend" "zerolock_frontend" "internet_identity")
    
    for canister in "${canisters[@]}"; do
        echo -e "${PURPLE} $canister:${NC}"
        
        if dfx canister id $canister > /dev/null 2>&1; then
            canister_id=$(dfx canister id $canister)
            echo -e "   ID: ${GREEN}$canister_id${NC}"
            
            # Get status
            if status_output=$(dfx canister status $canister 2>/dev/null); then
                status=$(echo "$status_output" | grep "Status:" | awk '{print $3}')
                memory=$(echo "$status_output" | grep "Memory Size:" | awk '{print $3, $4}')
                cycles=$(echo "$status_output" | grep "Balance:" | awk '{print $2, $3}')
                
                if [ "$status" = "Running" ]; then
                    echo -e "   Status: ${GREEN}$status${NC}"
                else
                    echo -e "   Status: ${YELLOW}$status${NC}"
                fi
                
                echo -e "   Memory: $memory"
                echo -e "   Cycles: $cycles"
            else
                echo -e "   Status: ${RED}Unable to retrieve${NC}"
            fi
        else
            echo -e "   ID: ${RED}Not found${NC}"
        fi
        
        echo -e ""
    done
}

# Check network connectivity
check_network() {
    echo -e "${BLUE} Checking network connectivity...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    # Check local connectivity
    echo -e "${PURPLE} Local connectivity check:${NC}"
    
    if ping -c 1 localhost > /dev/null 2>&1; then
        echo -e "   localhost: ${GREEN}Reachable${NC}"
    else
        echo -e "   localhost: ${RED}Unreachable${NC}"
    fi
    
    # Check DFX endpoint
    if curl -s http://localhost:4943/api/v2/status > /dev/null 2>&1; then
        echo -e "   DFX endpoint: ${GREEN}Reachable${NC}"
    else
        echo -e "   DFX endpoint: ${RED}Unreachable${NC}"
    fi
    
    echo -e ""
    
    # Check Internet Computer connectivity
    echo -e "${PURPLE}🌍 Internet Computer connectivity:${NC}"
    
    if curl -s --max-time 5 https://ic0.app > /dev/null 2>&1; then
        echo -e "   IC mainnet: ${GREEN}Reachable${NC}"
    else
        echo -e "   IC mainnet: ${YELLOW}Unreachable or timeout${NC}"
    fi
    
    echo -e ""
}

# Check frontend status
check_frontend() {
    echo -e "${BLUE} Checking frontend status...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    # Check frontend dependencies
    echo -e "${PURPLE} Frontend dependencies:${NC}"
    
    if [ -d "frontend/node_modules" ]; then
        echo -e "   node_modules: ${GREEN}Exists${NC}"
        
        # Check key dependencies
        key_deps=("react" "@dfinity/agent" "vite")
        for dep in "${key_deps[@]}"; do
            if [ -d "frontend/node_modules/$dep" ]; then
                echo -e "   $dep: ${GREEN}Installed${NC}"
            else
                echo -e "   $dep: ${RED}Not installed${NC}"
            fi
        done
    else
        echo -e "   node_modules: ${RED}Does not exist${NC}"
        echo -e "   Tip: Run 'cd frontend && npm install'"
    fi
    
    echo -e ""
    
    # Check frontend server
    echo -e "${PURPLE} Development server:${NC}"
    
    if pgrep -f "vite" > /dev/null 2>&1; then
        echo -e "   Vite server: ${GREEN}Running${NC}"
        
        # Check ports
        for port in 3000 3001; do
            if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
                echo -e "   Port $port: ${GREEN}Listening${NC}"
                
                # Test connection
                if curl -s http://localhost:$port > /dev/null 2>&1; then
                    echo -e "   HTTP response: ${GREEN}Normal${NC}"
                else
                    echo -e "   HTTP response: ${YELLOW}Abnormal${NC}"
                fi
                break
            fi
        done
    else
        echo -e "   Vite server: ${RED}Not running${NC}"
    fi
    
    echo -e ""
}

# View logs
check_logs() {
    echo -e "${BLUE} Viewing system logs...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    # DFX logs
    echo -e "${PURPLE} DFX logs (last 20 lines):${NC}"
    if [ -f ".dfx/local/replica.log" ]; then
        tail -n 20 .dfx/local/replica.log | while IFS= read -r line; do
            echo -e "  $line"
        done
    else
        echo -e "   DFX log file does not exist"
    fi
    
    echo -e ""
    
    # Canister logs
    echo -e "${PURPLE} Canister logs:${NC}"
    if dfx ping > /dev/null 2>&1; then
        for canister in "zerolock_backend" "zerolock_frontend"; do
            if dfx canister id $canister > /dev/null 2>&1; then
                echo -e "   $canister:"
                dfx canister logs $canister 2>/dev/null | tail -n 5 | while IFS= read -r line; do
                    echo -e "    $line"
                done
            fi
        done
    else
        echo -e "   DFX network not running, unable to retrieve Canister logs"
    fi
    
    echo -e ""
}

# Check port usage
check_ports() {
    echo -e "${BLUE} Checking port usage...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    ports=("3000" "3001" "4943" "8000" "8080")
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
            process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            echo -e "   Port $port: ${RED}Occupied${NC} (PID: $pid, Process: $process)"
        else
            echo -e "   Port $port: ${GREEN}Free${NC}"
        fi
    done
    
    echo -e ""
}

# Auto-fix common issues
auto_fix() {
    echo -e "${BLUE} Trying to auto-fix common issues...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    # Fix frontend dependencies
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "${YELLOW} Installing frontend dependencies...${NC}"
        cd frontend
        npm install
        cd ..
        echo -e "${GREEN} Frontend dependencies installation completed${NC}"
    fi
    
    # Fix environment variables
    if [ ! -f "frontend/.env" ]; then
        echo -e "${YELLOW} Creating environment variables file...${NC}"
        
        if dfx ping > /dev/null 2>&1; then
            backend_id=$(dfx canister id zerolock_backend 2>/dev/null || echo "uxrrr-q7777-77774-qaaaq-cai")
            ii_id=$(dfx canister id internet_identity 2>/dev/null || echo "uzt4z-lp777-77774-qaabq-cai")
        else
            backend_id="uxrrr-q7777-77774-qaaaq-cai"
            ii_id="uzt4z-lp777-77774-qaabq-cai"
        fi
        
        cat > frontend/.env << EOF
# ZeroLock Frontend Environment Variables

# DFX Network Configuration
VITE_DFX_NETWORK=local
VITE_IC_HOST=http://localhost:4943

# Internet Identity Configuration
VITE_INTERNET_IDENTITY_CANISTER_ID=${ii_id}
VITE_INTERNET_IDENTITY_URL=http://{ii_id}.localhost:4943

# Backend Canister Configuration
VITE_ZEROLOCK_BACKEND_CANISTER_ID=${backend_id}

# App Configuration
VITE_APP_NAME=ZeroLock
VITE_APP_VERSION=1.0.0
EOF
        echo -e "${GREEN} Environment variables file creation completed${NC}"
    fi
    
    # Fix permission issues
    echo -e "${YELLOW} Fixing file permissions...${NC}"
    chmod +x start.sh stop.sh debug.sh 2>/dev/null || true
    echo -e "${GREEN} Permission fix completed${NC}"
    
    echo -e "${GREEN} Auto-fix completed${NC}"
}

# Reset project
reset_project() {
    echo -e "${RED} Reset project to initial state${NC}"
    echo -e "${YELLOW}This will delete all local data and cache, continue? (y/N)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE} Resetting project...${NC}"
        
        # Stop all services
        ./stop.sh --force 2>/dev/null || true
        
        # Clean cache
        rm -rf .dfx/local 2>/dev/null || true
        rm -rf frontend/node_modules 2>/dev/null || true
        rm -rf frontend/dist 2>/dev/null || true
        rm -rf target 2>/dev/null || true
        
        # Reinstall dependencies
        cd frontend
        npm install
        cd ..
        
        # Rebuild
        cargo build
        
        echo -e "${GREEN} Project reset completed${NC}"
        echo -e "${BLUE} You can now run './start.sh' to restart the project${NC}"
    else
        echo -e "${YELLOW} Reset operation cancelled${NC}"
    fi
}

# Run all checks
run_all_checks() {
    check_environment
    check_canisters
    check_network
    check_frontend
    check_logs
    check_ports
}

# Main function
main() {
    case "$1" in
        --env|-e)
            check_environment
            ;;
        --canisters|-c)
            check_canisters
            ;;
        --network|-n)
            check_network
            ;;
        --frontend|-f)
            check_frontend
            ;;
        --logs|-l)
            check_logs
            ;;
        --ports|-p)
            check_ports
            ;;
        --all|-a)
            run_all_checks
            ;;
        --fix)
            auto_fix
            ;;
        --reset)
            reset_project
            ;;
        --help|-h|"")
            show_help
            ;;
        *)
            echo -e "${RED} Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"