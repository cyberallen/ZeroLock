#!/bin/bash
set -e

# 全局变量
FORCE_DEPLOY=false
SKIP_FRONTEND=false

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force-deploy|-f)
                FORCE_DEPLOY=true
                shift
                ;;
            --skip-frontend|-s)
                SKIP_FRONTEND=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 显示帮助信息
show_help() {
    echo "ZeroLock 项目启动脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -f, --force-deploy    强制重新部署所有 canisters"
    echo "  -s, --skip-frontend   跳过前端开发服务器启动"
    echo "  -h, --help           显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 正常启动（智能部署）"
    echo "  $0 --force-deploy    # 强制重新部署所有组件"
    echo "  $0 --skip-frontend   # 只部署，不启动前端服务器"
}

echo "启动 ZeroLock 项目..."

# 检查必需工具
check_requirements() {
    echo -e " 检查环境要求..."
    
    if ! command -v dfx &> /dev/null; then
        echo -e " DFX 未安装，请先安装 DFX SDK"
        exit 1
    fi
    
    if ! command -v cargo &> /dev/null; then
        echo -e " Rust 未安装，请先安装 Rust"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e " Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    echo -e " 环境检查通过"
}

# 检查并安装前端依赖
install_dependencies() {
    echo -e " 检查前端依赖..."
    
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "前端依赖未安装，正在安装..."
        cd frontend
        npm install
        cd ..
        echo -e " 前端依赖安装完成"
    else
        echo -e " 前端依赖已存在"
    fi
}

# 构建后端
build_backend() {
    echo -e " 构建后端..."
    cargo build --target wasm32-unknown-unknown 
    echo -e " 后端构建完成"
}

# 启动 IC 网络
start_ic_network() {
    echo -e " 检查 Internet Computer 本地网络..."
    
    if ! dfx ping > /dev/null 2>&1; then
        echo -e "IC 网络未运行，正在启动..."
        dfx start --background
        
        # 等待网络启动
        echo -e " 等待网络启动..."
        for i in {1..30}; do
            if dfx ping > /dev/null 2>&1; then
                echo -e " IC 网络启动成功"
                break
            fi
            sleep 1
            echo -n "."
        done
        
        if ! dfx ping > /dev/null 2>&1; then
            echo -e " IC 网络启动失败"
            exit 1
        fi
    else
        echo -e " IC 网络已运行"
    fi
}

# 检查是否需要部署后端
check_backend_changes() {
    # 如果强制部署，直接返回需要部署
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        return 0
    fi
    
    # 检查后端 canister 是否存在
    if ! dfx canister status zerolock_backend > /dev/null 2>&1; then
        return 0  # 需要部署
    fi
    
    # 检查源代码是否有变化
    local wasm_file="target/wasm32-unknown-unknown/debug/zerolock.wasm"
    if [[ ! -f "$wasm_file" ]]; then
        return 0  # wasm 文件不存在，需要部署
    fi
    
    # 检查 src 目录下的文件是否比 wasm 文件新
    if find src/ -name "*.rs" -newer "$wasm_file" | grep -q .; then
        return 0  # 有新的源代码变化
    fi
    
    # 检查 Cargo.toml 是否有变化
    if [[ "Cargo.toml" -nt "$wasm_file" ]]; then
        return 0  # 依赖配置有变化
    fi
    
    return 1  # 不需要部署
}

# 检查是否需要部署前端
check_frontend_changes() {
    # 如果强制部署，直接返回需要部署
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        return 0
    fi
    
    # 检查前端 canister 是否存在
    if ! dfx canister status zerolock_frontend > /dev/null 2>&1; then
        return 0  # 需要部署
    fi
    
    # 检查前端源代码是否有变化（简单检查，可以根据需要优化）
    local dist_dir="frontend/dist"
    if [[ ! -d "$dist_dir" ]]; then
        return 0  # dist 目录不存在，需要部署
    fi
    
    # 检查前端源代码是否比 dist 目录新
    if find frontend/src/ -name "*" -newer "$dist_dir" | grep -q .; then
        return 0  # 有新的前端代码变化
    fi
    
    return 1  # 不需要部署
}

# 智能部署 Canisters
deploy_canisters() {
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        echo -e " 强制部署所有 Canisters..."
    else
        echo -e " 智能部署 Canisters（检查代码变化）..."
    fi
    
    # 检查是否需要创建 canisters
    if ! dfx canister id zerolock_backend > /dev/null 2>&1; then
        echo -e "创建 Canisters..."
        dfx canister create --all
    fi
    
    # 智能部署后端
    if check_backend_changes; then
        if [[ "$FORCE_DEPLOY" == "true" ]]; then
            echo -e " [强制模式] 部署后端 Canister..."
        else
            echo -e " [变化检测] 检测到后端代码变化，部署后端 Canister..."
        fi
        dfx deploy zerolock_backend
    else
        echo -e " [跳过] 后端代码无变化，跳过部署"
    fi
    
    # 智能部署前端
    if check_frontend_changes; then
        if [[ "$FORCE_DEPLOY" == "true" ]]; then
            echo -e " [强制模式] 部署前端 Canister..."
        else
            echo -e " [变化检测] 检测到前端代码变化，部署前端 Canister..."
        fi
        dfx deploy zerolock_frontend
    else
        echo -e " [跳过] 前端代码无变化，跳过部署"
    fi
    
    # 部署 Internet Identity（如果不存在）
    if ! dfx canister id internet_identity > /dev/null 2>&1; then
        echo -e "部署 Internet Identity..."
        dfx deploy internet_identity || {
            echo -e "Internet Identity 部署失败，使用默认配置"
        }
    else
        echo -e " [跳过] Internet Identity 已存在"
    fi
    
    echo -e " Canisters 部署完成"
}

# 更新环境变量
update_env_vars() {
    echo -e "更新环境变量..."
    
    # 获取 canister IDs
    BACKEND_ID=$(dfx canister id zerolock_backend)
    FRONTEND_ID=$(dfx canister id zerolock_frontend)
    
    # 尝试获取 Internet Identity ID
    if dfx canister id internet_identity > /dev/null 2>&1; then
        II_ID=$(dfx canister id internet_identity)
    else
        II_ID="umunu-kh777-77774-qaaca-cai"  # 使用当前配置的 ID
    fi
    
    # 创建环境变量文件
    cat > frontend/.env << EOF
# ZeroLock Frontend Environment Variables

# DFX Network Configuration
VITE_DFX_NETWORK=local
VITE_IC_HOST=http://localhost:4943

# Internet Identity Configuration
VITE_INTERNET_IDENTITY_CANISTER_ID=${II_ID}
VITE_INTERNET_IDENTITY_URL=http://localhost:4943/?canisterId=${II_ID}

# Backend Canister Configuration
VITE_ZEROLOCK_BACKEND_CANISTER_ID=${BACKEND_ID}

# App Configuration
VITE_APP_NAME=ZeroLock
VITE_APP_VERSION=1.0.0
EOF
    
    echo -e " 环境变量更新完成"
    echo -e " Canister IDs:"
    echo -e "   Backend: ${BACKEND_ID}"
    echo -e "   Frontend: ${FRONTEND_ID}"
    echo -e "   Internet Identity: ${II_ID}"
}

# 启动前端开发服务器
start_frontend() {
    echo -e " 启动前端开发服务器..."
    
    cd frontend
    
    # 检查端口是否被占用
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "端口 3000 被占用，尝试使用其他端口..."
        npm run dev -- --port 3001
    else
        npm run dev
    fi
}

# 主函数
main() {
    # 解析命令行参数
    parse_args "$@"
    
    echo -e " ZeroLock 项目启动脚本"
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        echo -e " 模式: 强制重新部署"
    else
        echo -e " 模式: 智能部署（仅在代码变化时部署）"
    fi
    echo -e "==========================================="
    
    check_requirements
    install_dependencies
    build_backend
    start_ic_network
    deploy_canisters
    update_env_vars
    
    echo -e " 项目启动准备完成！"
    echo -e "==========================================="
    
    if [[ "$SKIP_FRONTEND" == "true" ]]; then
        echo -e " 跳过前端开发服务器启动"
        echo -e " 提示: 手动启动前端请运行: cd frontend && npm run dev"
    else
        echo -e "正在启动前端开发服务器..."
        echo -e " 提示: 按 Ctrl+C 停止服务器"
        echo -e "==========================================="
        start_frontend
    fi
}

# 错误处理
trap 'echo -e " 启动过程中发生错误"; exit 1' ERR

# 运行主函数
main "$@"
