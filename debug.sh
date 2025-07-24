#!/bin/bash

echo " ZeroLock 项目调试工具"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo -e "${BLUE} ZeroLock 调试工具使用说明${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo -e "用法: ./debug.sh [选项]"
    echo -e ""
    echo -e "选项:"
    echo -e "  --env, -e        检查环境配置"
    echo -e "  --canisters, -c  检查 Canister 状态"
    echo -e "  --network, -n    检查网络连接"
    echo -e "  --frontend, -f   检查前端状态"
    echo -e "  --logs, -l       查看日志"
    echo -e "  --ports, -p      检查端口占用"
    echo -e "  --all, -a        执行所有检查"
    echo -e "  --fix            尝试自动修复常见问题"
    echo -e "  --reset          重置项目到初始状态"
    echo -e "  --help, -h       显示此帮助信息"
    echo -e ""
    echo -e "示例:"
    echo -e "  ./debug.sh --all          # 执行所有检查"
    echo -e "  ./debug.sh --canisters    # 只检查 Canister 状态"
    echo -e "  ./debug.sh --fix          # 尝试自动修复问题"
}

# 检查环境配置
check_environment() {
    echo -e "${BLUE} 检查环境配置...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    # 检查必需工具
    echo -e "${PURPLE} 必需工具检查:${NC}"
    
    tools=("dfx" "cargo" "rustc" "node" "npm")
    for tool in "${tools[@]}"; do
        if command -v $tool &> /dev/null; then
            version=$($tool --version 2>/dev/null | head -n1 || echo "未知版本")
            echo -e "   $tool: ${GREEN}$version${NC}"
        else
            echo -e "   $tool: ${RED}未安装${NC}"
        fi
    done
    
    echo -e ""
    
    # 检查环境变量
    echo -e "${PURPLE} 环境变量检查:${NC}"
    
    if [ -f "frontend/.env" ]; then
        echo -e "   环境文件: ${GREEN}存在${NC}"
        echo -e "${YELLOW}   环境变量内容:${NC}"
        while IFS= read -r line; do
            if [[ $line =~ ^[A-Z] ]]; then
                echo -e "    $line"
            fi
        done < frontend/.env
    else
        echo -e "   环境文件: ${RED}不存在${NC}"
    fi
    
    echo -e ""
    
    # 检查项目文件
    echo -e "${PURPLE} 项目文件检查:${NC}"
    
    files=("dfx.json" "Cargo.toml" "frontend/package.json" "src/lib.rs")
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "   $file: ${GREEN}存在${NC}"
        else
            echo -e "   $file: ${RED}缺失${NC}"
        fi
    done
    
    echo -e ""
}

# 检查 Canister 状态
check_canisters() {
    echo -e "${BLUE} 检查 Canister 状态...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    # 检查 DFX 网络
    if ! dfx ping > /dev/null 2>&1; then
        echo -e "   DFX 网络: ${RED}未运行${NC}"
        echo -e "   提示: 运行 'dfx start --background' 启动网络"
        return 1
    else
        echo -e "   DFX 网络: ${GREEN}运行中${NC}"
    fi
    
    echo -e ""
    
    # 检查各个 Canister
    canisters=("zerolock_backend" "zerolock_frontend" "internet_identity")
    
    for canister in "${canisters[@]}"; do
        echo -e "${PURPLE} $canister:${NC}"
        
        if dfx canister id $canister > /dev/null 2>&1; then
            canister_id=$(dfx canister id $canister)
            echo -e "   ID: ${GREEN}$canister_id${NC}"
            
            # 获取状态
            if status_output=$(dfx canister status $canister 2>/dev/null); then
                status=$(echo "$status_output" | grep "Status:" | awk '{print $3}')
                memory=$(echo "$status_output" | grep "Memory Size:" | awk '{print $3, $4}')
                cycles=$(echo "$status_output" | grep "Balance:" | awk '{print $2, $3}')
                
                if [ "$status" = "Running" ]; then
                    echo -e "  状态: ${GREEN}$status${NC}"
                else
                    echo -e "   状态: ${YELLOW}$status${NC}"
                fi
                
                echo -e "   内存: $memory"
                echo -e "   Cycles: $cycles"
            else
                echo -e "   状态: ${RED}无法获取${NC}"
            fi
        else
            echo -e "   ID: ${RED}未找到${NC}"
        fi
        
        echo -e ""
    done
}

# 检查网络连接
check_network() {
    echo -e "${BLUE} 检查网络连接...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    # 检查本地连接
    echo -e "${PURPLE} 本地连接检查:${NC}"
    
    if ping -c 1 localhost > /dev/null 2>&1; then
        echo -e "   localhost: ${GREEN}可达${NC}"
    else
        echo -e "   localhost: ${RED}不可达${NC}"
    fi
    
    # 检查 DFX 端点
    if curl -s http://localhost:4943/api/v2/status > /dev/null 2>&1; then
        echo -e "   DFX 端点: ${GREEN}可达${NC}"
    else
        echo -e "   DFX 端点: ${RED}不可达${NC}"
    fi
    
    echo -e ""
    
    # 检查 Internet Computer 连接
    echo -e "${PURPLE}🌍 Internet Computer 连接:${NC}"
    
    if curl -s --max-time 5 https://ic0.app > /dev/null 2>&1; then
        echo -e "   IC 主网: ${GREEN}可达${NC}"
    else
        echo -e "   IC 主网: ${YELLOW}不可达或超时${NC}"
    fi
    
    echo -e ""
}

# 检查前端状态
check_frontend() {
    echo -e "${BLUE} 检查前端状态...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    # 检查前端依赖
    echo -e "${PURPLE} 前端依赖:${NC}"
    
    if [ -d "frontend/node_modules" ]; then
        echo -e "   node_modules: ${GREEN}存在${NC}"
        
        # 检查关键依赖
        key_deps=("react" "@dfinity/agent" "vite")
        for dep in "${key_deps[@]}"; do
            if [ -d "frontend/node_modules/$dep" ]; then
                echo -e "   $dep: ${GREEN}已安装${NC}"
            else
                echo -e "   $dep: ${RED}未安装${NC}"
            fi
        done
    else
        echo -e "   node_modules: ${RED}不存在${NC}"
        echo -e "   提示: 运行 'cd frontend && npm install'"
    fi
    
    echo -e ""
    
    # 检查前端服务器
    echo -e "${PURPLE} 开发服务器:${NC}"
    
    if pgrep -f "vite" > /dev/null 2>&1; then
        echo -e "   Vite 服务器: ${GREEN}运行中${NC}"
        
        # 检查端口
        for port in 3000 3001; do
            if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
                echo -e "   端口 $port: ${GREEN}监听中${NC}"
                
                # 测试连接
                if curl -s http://localhost:$port > /dev/null 2>&1; then
                    echo -e "   HTTP 响应: ${GREEN}正常${NC}"
                else
                    echo -e "   HTTP 响应: ${YELLOW}异常${NC}"
                fi
                break
            fi
        done
    else
        echo -e "   Vite 服务器: ${RED}未运行${NC}"
    fi
    
    echo -e ""
}

# 查看日志
check_logs() {
    echo -e "${BLUE} 查看系统日志...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    # DFX 日志
    echo -e "${PURPLE} DFX 日志 (最近 20 行):${NC}"
    if [ -f ".dfx/local/replica.log" ]; then
        tail -n 20 .dfx/local/replica.log | while IFS= read -r line; do
            echo -e "  $line"
        done
    else
        echo -e "   DFX 日志文件不存在"
    fi
    
    echo -e ""
    
    # Canister 日志
    echo -e "${PURPLE} Canister 日志:${NC}"
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
        echo -e "   DFX 网络未运行，无法获取 Canister 日志"
    fi
    
    echo -e ""
}

# 检查端口占用
check_ports() {
    echo -e "${BLUE} 检查端口占用...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    ports=("3000" "3001" "4943" "8000" "8080")
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
            process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            echo -e "   端口 $port: ${RED}被占用${NC} (PID: $pid, 进程: $process)"
        else
            echo -e "   端口 $port: ${GREEN}空闲${NC}"
        fi
    done
    
    echo -e ""
}

# 自动修复常见问题
auto_fix() {
    echo -e "${BLUE} 尝试自动修复常见问题...${NC}"
    echo -e "${CYAN}===========================================${NC}"
    
    # 修复前端依赖
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "${YELLOW} 安装前端依赖...${NC}"
        cd frontend
        npm install
        cd ..
        echo -e "${GREEN} 前端依赖安装完成${NC}"
    fi
    
    # 修复环境变量
    if [ ! -f "frontend/.env" ]; then
        echo -e "${YELLOW} 创建环境变量文件...${NC}"
        
        if dfx ping > /dev/null 2>&1; then
            backend_id=$(dfx canister id zerolock_backend 2>/dev/null || echo "uxrrr-q7777-77774-qaaaq-cai")
            ii_id=$(dfx canister id internet_identity 2>/dev/null || echo "umunu-kh777-77774-qaaca-cai")
        else
            backend_id="uxrrr-q7777-77774-qaaaq-cai"
            ii_id="umunu-kh777-77774-qaaca-cai"
        fi
        
        cat > frontend/.env << EOF
# ZeroLock Frontend Environment Variables

# DFX Network Configuration
VITE_DFX_NETWORK=local
VITE_IC_HOST=http://localhost:4943

# Internet Identity Configuration
VITE_INTERNET_IDENTITY_CANISTER_ID=${ii_id}
VITE_INTERNET_IDENTITY_URL=http://localhost:4943/?canisterId=${ii_id}

# Backend Canister Configuration
VITE_ZEROLOCK_BACKEND_CANISTER_ID=${backend_id}

# App Configuration
VITE_APP_NAME=ZeroLock
VITE_APP_VERSION=1.0.0
EOF
        echo -e "${GREEN} 环境变量文件创建完成${NC}"
    fi
    
    # 修复权限问题
    echo -e "${YELLOW} 修复文件权限...${NC}"
    chmod +x start.sh stop.sh debug.sh 2>/dev/null || true
    echo -e "${GREEN} 权限修复完成${NC}"
    
    echo -e "${GREEN} 自动修复完成${NC}"
}

# 重置项目
reset_project() {
    echo -e "${RED} 重置项目到初始状态${NC}"
    echo -e "${YELLOW}这将删除所有本地数据和缓存，是否继续？ (y/N)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE} 重置项目...${NC}"
        
        # 停止所有服务
        ./stop.sh --force 2>/dev/null || true
        
        # 清理缓存
        rm -rf .dfx/local 2>/dev/null || true
        rm -rf frontend/node_modules 2>/dev/null || true
        rm -rf frontend/dist 2>/dev/null || true
        rm -rf target 2>/dev/null || true
        
        # 重新安装依赖
        cd frontend
        npm install
        cd ..
        
        # 重新构建
        cargo build
        
        echo -e "${GREEN} 项目重置完成${NC}"
        echo -e "${BLUE} 现在可以运行 './start.sh' 重新启动项目${NC}"
    else
        echo -e "${YELLOW} 重置操作已取消${NC}"
    fi
}

# 执行所有检查
run_all_checks() {
    check_environment
    check_canisters
    check_network
    check_frontend
    check_logs
    check_ports
}

# 主函数
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
            echo -e "${RED} 未知选项: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"