#!/bin/bash
# 生成前端 Candid 绑定文件的脚本

# 生成 TypeScript 绑定
dfx generate zerolock_backend

# 复制生成的声明文件到前端
mkdir -p frontend/src/declarations
cp -r .dfx/local/canisters/zerolock_backend frontend/src/declarations/

echo "Candid bindings generated successfully!"
echo "Generated files:"
echo "- frontend/src/declarations/zerolock_backend/"
echo "  - index.js"
echo "  - zerolock_backend.did.js"
echo "  - zerolock_backend.did.d.ts"
