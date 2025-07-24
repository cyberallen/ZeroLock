#!/bin/bash

echo " 停止 ZeroLock 项目..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 停止前端开发服务器
stop_frontend() {
    echo -e "${BLUE} 停止前端开发服务器...${NC}"
    
    # 查找并停止 Vite 进程
    VITE_PIDS=$(pgrep -f "vite" 2>/dev/null || true)
    if [ ! -z "$VITE_PIDS" ]; then
        echo -e "${YELLOW} 发现运行中的 Vite 进程: $VITE_PIDS${NC}"
        echo $VITE_PIDS | xargs kill -TERM 2>/dev/null || true
        sleep 2
        
        # 强制停止仍在运行的进程
        REMAINING_PIDS=$(pgrep -f "vite" 2>/dev/null || true)
        if [ ! -z "$REMAINING_PIDS" ]; then
            echo -e "${RED} 强制停止残留进程: $REMAINING_PIDS${NC}"
            echo $REMAINING_PIDS | xargs kill -KILL 2>/dev/null || true
        fi
        
        echo -e "${GREEN} 前端服务器已停止${NC}"
    else
        echo -e "${GREEN} 前端服务器未运行${NC}"
    fi
    
    # 停止可能的 Node.js 开发服务器
    NODE_DEV_PIDS=$(pgrep -f "node.*dev" 2>/dev/null || true)
    if [ ! -z "$NODE_DEV_PIDS" ]; then
        echo -e "${YELLOW} 停止 Node.js 开发进程: $NODE_DEV_PIDS${NC}"
        echo $NODE_DEV_PIDS | xargs kill -TERM 2>/dev/null || true
    fi
}

# 停止 Internet Computer 网络
stop_ic_network() {
    echo -e "${BLUE} 停止 Internet Computer 网络...${NC}"
    
    # 检查 dfx 是否运行
    if dfx ping > /dev/null 2>&1; then
        echo -e "${YELLOW} 正在停止 DFX 网络...${NC}"
        dfx stop
        echo -e "${GREEN} DFX 网络已停止${NC}"
    else
        echo -e "${GREEN} DFX 网络未运行${NC}"
    fi
}

# 清理 DFX 进程
cleanup_dfx_processes() {
    echo -e "${BLUE} 清理 DFX 相关进程...${NC}"
    
    # 使用 dfx killall 清理
    dfx killall 2>/dev/null || true
    
    # 手动清理可能残留的 dfx 进程
    DFX_PIDS=$(pgrep -f "dfx" 2>/dev/null || true)
    if [ ! -z "$DFX_PIDS" ]; then
        echo -e "${YELLOW} 清理残留的 DFX 进程: $DFX_PIDS${NC}"
        echo $DFX_PIDS | xargs kill -TERM 2>/dev/null || true
        sleep 2
        
        # 强制清理
        REMAINING_DFX_PIDS=$(pgrep -f "dfx" 2>/dev/null || true)
        if [ ! -z "$REMAINING_DFX_PIDS" ]; then
            echo -e "${RED} 强制清理 DFX 进程: $REMAINING_DFX_PIDS${NC}"
            echo $REMAINING_DFX_PIDS | xargs kill -KILL 2>/dev/null || true
        fi
    fi
    
    # 清理 IC 相关进程
    IC_PIDS=$(pgrep -f "ic-starter\|replica\|canister_sandbox" 2>/dev/null || true)
    if [ ! -z "$IC_PIDS" ]; then
        echo -e "${YELLOW} 清理 IC 相关进程: $IC_PIDS${NC}"
        echo $IC_PIDS | xargs kill -TERM 2>/dev/null || true
        sleep 1
        
        # 强制清理
        REMAINING_IC_PIDS=$(pgrep -f "ic-starter\|replica\|canister_sandbox" 2>/dev/null || true)
        if [ ! -z "$REMAINING_IC_PIDS" ]; then
            echo -e "${RED} 强制清理 IC 进程: $REMAINING_IC_PIDS${NC}"
            echo $REMAINING_IC_PIDS | xargs kill -KILL 2>/dev/null || true
        fi
    fi
    
    echo -e "${GREEN} 进程清理完成${NC}"
}

# 检查端口占用
check_ports() {
    echo -e "${BLUE} 检查端口占用情况...${NC}"
    
    # 检查常用端口
    PORTS=("3000" "3001" "4943" "8000" "8080")
    
    for port in "${PORTS[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            PID=$(lsof -Pi :$port -sTCP:LISTEN -t)
            PROCESS=$(ps -p $PID -o comm= 2>/dev/null || echo "unknown")
            echo -e "${YELLOW} 端口 $port 仍被占用 (PID: $PID, 进程: $PROCESS)${NC}"
        fi
    done
}

# 清理临时文件
cleanup_temp_files() {
    echo -e "${BLUE} 清理临时文件...${NC}"
    
    # 清理 .dfx 临时文件（保留配置）
    if [ -d ".dfx/local" ]; then
        echo -e "${YELLOW} 清理 .dfx/local 目录...${NC}"
        rm -rf .dfx/local/replica.log* 2>/dev/null || true
    fi
    
    # 清理前端临时文件
    if [ -d "frontend" ]; then
        rm -rf frontend/.vite 2>/dev/null || true
        rm -rf frontend/dist/.vite 2>/dev/null || true
    fi
    
    echo -e "${GREEN} 临时文件清理完成${NC}"
}

# 显示停止状态
show_status() {
    echo -e "${BLUE} 当前状态:${NC}"
    
    # 检查 DFX 状态
    if dfx ping > /dev/null 2>&1; then
        echo -e "   DFX: ${RED}仍在运行${NC}"
    else
        echo -e "   DFX: ${GREEN}已停止${NC}"
    fi
    
    # 检查前端服务器
    if pgrep -f "vite" > /dev/null 2>&1; then
        echo -e "   前端: ${RED}仍在运行${NC}"
    else
        echo -e "   前端: ${GREEN}已停止${NC}"
    fi
    
    # 检查端口
    if lsof -Pi :4943 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "   端口 4943: ${RED}被占用${NC}"
    else
        echo -e "   端口 4943: ${GREEN}空闲${NC}"
    fi
    
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "   端口 3000: ${RED}被占用${NC}"
    else
        echo -e "   端口 3000: ${GREEN}空闲${NC}"
    fi
}

# 主函数
main() {
    echo -e "${GREEN} ZeroLock 项目停止脚本${NC}"
    echo -e "${BLUE}===========================================${NC}"
    
    stop_frontend
    stop_ic_network
    cleanup_dfx_processes
    cleanup_temp_files
    
    echo -e "${BLUE}===========================================${NC}"
    show_status
    echo -e "${BLUE}===========================================${NC}"
    
    check_ports
    
    echo -e "${GREEN} ZeroLock 项目已完全停止${NC}"
    echo -e "${BLUE} 提示: 如果仍有端口被占用，可以手动停止相关进程${NC}"
}

# 强制清理选项
if [ "$1" = "--force" ] || [ "$1" = "-f" ]; then
    echo -e "${RED} 强制清理模式${NC}"
    
    # 强制停止所有相关进程
    pkill -f "vite" 2>/dev/null || true
    pkill -f "dfx" 2>/dev/null || true
    pkill -f "ic-starter" 2>/dev/null || true
    pkill -f "replica" 2>/dev/null || true
    pkill -f "canister_sandbox" 2>/dev/null || true
    
    # 强制清理端口
    for port in 3000 3001 4943; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            PID=$(lsof -Pi :$port -sTCP:LISTEN -t)
            echo -e "${RED} 强制停止占用端口 $port 的进程 (PID: $PID)${NC}"
            kill -KILL $PID 2>/dev/null || true
        fi
    done
    
    # 清理所有临时文件
    rm -rf .dfx/local 2>/dev/null || true
    rm -rf frontend/.vite 2>/dev/null || true
    rm -rf frontend/dist 2>/dev/null || true
    
    echo -e "${GREEN} 强制清理完成${NC}"
else
    # 正常停止流程
    main
fi

echo -e "${BLUE} 使用 './stop.sh --force' 进行强制清理${NC}"