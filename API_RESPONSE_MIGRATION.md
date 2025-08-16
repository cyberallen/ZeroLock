# API 返回值统一和边界条件改进

## 概述
本次更新统一了所有 public 方法的返回值为 `ApiResponse<T>` 类型，并添加了全面的边界条件检查和错误映射。

## 主要变更

### 1. 错误类型扩展 (`types.rs`)
新增的错误类型：
- `PaginationError`: 分页参数错误
- `WasmSizeExceeded`: WASM 尺寸超限
- `TimeRangeError`: 时间范围错误  
- `PermissionDenied`: 权限被拒绝
- `RateLimitExceeded`: 速率限制超限

### 2. 边界条件常量 (`types.rs`)
```rust
pub const MAX_WASM_SIZE: usize = 2 * 1024 * 1024; // 2MB
pub const MAX_PAGINATION_LIMIT: u64 = 100;
pub const MAX_DISPLAY_NAME_LENGTH: usize = 50;
pub const MAX_DESCRIPTION_LENGTH: usize = 1000;
pub const MAX_CANDID_INTERFACE_LENGTH: usize = 10000;
pub const MIN_CHALLENGE_DURATION: i64 = 24 * 60 * 60 * 1_000_000_000; // 1 day
pub const MAX_CHALLENGE_DURATION: i64 = 365 * 24 * 60 * 60 * 1_000_000_000; // 1 year
pub const MAX_TRANSACTION_HISTORY_LIMIT: u64 = 1000;
pub const MAX_BALANCE_HISTORY_LIMIT: u64 = 1000;
```

### 3. 验证函数 (`types.rs`)
新增的验证函数：
- `validate_pagination_params()`: 分页参数验证
- `validate_wasm_size()`: WASM 尺寸验证
- `validate_display_name()`: 显示名称验证
- `validate_description()`: 描述验证
- `validate_candid_interface()`: Candid 接口验证
- `validate_time_range()`: 时间范围验证
- `check_caller_not_anonymous()`: 匿名调用者检查

## 方法更新

### BountyFactory 模块
| 方法 | 原返回类型 | 新返回类型 | 边界条件 |
|------|-----------|-----------|---------|
| `list_challenges` | `Vec<Challenge>` | `ApiResponse<PaginatedResult<Challenge>>` | 分页上限100 |
| `get_challenge_stats` | `ChallengeStats` | `ApiResponse<ChallengeStats>` | N/A |
| `get_company_challenges` | `Vec<Challenge>` | `ApiResponse<PaginatedResult<Challenge>>` | 分页上限100 |
| `get_admins` | `Vec<Principal>` | `ApiResponse<Vec<Principal>>` | 权限检查 |

### Leaderboard 模块
| 方法 | 原返回类型 | 新返回类型 | 边界条件 |
|------|-----------|-----------|---------|
| `register_user` | `Result<(), ZeroLockError>` | `ApiResponse<()>` | 匿名检查 |
| `set_display_name` | `Result<(), ZeroLockError>` | `ApiResponse<()>` | 长度50字符 |
| `get_hacker_leaderboard` | `Vec<LeaderboardEntry>` | `ApiResponse<Vec<LeaderboardEntry>>` | 分页上限100 |
| `get_company_leaderboard` | `Vec<CompanyLeaderboardEntry>` | `ApiResponse<Vec<CompanyLeaderboardEntry>>` | 分页上限100 |
| `get_user_profile` | `Result<...>` | `ApiResponse<...>` | N/A |
| `get_platform_stats` | `PlatformStats` | `ApiResponse<PlatformStats>` | N/A |
| `get_user_stats` | `UserStats` | `ApiResponse<UserStats>` | N/A |
| `set_bounty_factory_for_leaderboard` | `Result<(), ZeroLockError>` | `ApiResponse<()>` | 匿名检查 |

### Vault 模块
| 方法 | 原返回类型 | 新返回类型 | 边界条件 |
|------|-----------|-----------|---------|
| `get_transaction_history` | `Vec<Transaction>` | `ApiResponse<PaginatedResult<Transaction>>` | 上限1000条 |
| `get_vault_stats` | `VaultStats` | `ApiResponse<VaultStats>` | N/A |
| `get_authorized_canisters` | `Vec<Principal>` | `ApiResponse<Vec<Principal>>` | 匿名检查 |
| `is_paused` | `bool` | `ApiResponse<bool>` | N/A |

### Judge 模块
| 方法 | 原返回类型 | 新返回类型 | 边界条件 |
|------|-----------|-----------|---------|
| `get_evaluations` | `Vec<Evaluation>` | `ApiResponse<Vec<Evaluation>>` | N/A |
| `get_balance_history` | `Vec<BalanceSnapshot>` | `ApiResponse<Vec<BalanceSnapshot>>` | 上限1000条 |
| `get_open_disputes` | `Vec<DisputeCase>` | `ApiResponse<Vec<DisputeCase>>` | N/A |
| `get_config` | `JudgeConfig` | `ApiResponse<JudgeConfig>` | N/A |

## 安全性改进

### 1. 匿名调用者防护
所有更新操作现在都会检查调用者是否为匿名用户：
```rust
let caller = match check_caller_not_anonymous() {
    Ok(c) => c,
    Err(e) => return ApiResponse::Err(e),
};
```

### 2. 权限控制
敏感操作（如查看管理员列表、授权罐列表）现在需要适当权限。

### 3. 输入验证
所有用户输入现在都经过严格验证，包括：
- WASM 代码尺寸（最大2MB）
- 显示名称长度（最大50字符）
- 描述长度（最大1000字符）
- 时间范围合理性

### 4. 资源限制
- 分页查询限制为每页最多100条记录
- 交易历史限制为最多1000条
- 余额历史限制为最多1000条

## 分页支持
引入了 `PaginatedResult<T>` 类型，提供完整的分页信息：
```rust
pub struct PaginatedResult<T> {
    pub data: Vec<T>,
    pub total: u64,
    pub offset: u64,
    pub limit: u64,
    pub has_more: bool,
}
```

## 向后兼容性
虽然返回类型从多种格式统一为 `ApiResponse<T>`，但客户端可以通过模式匹配轻松处理：
```rust
match api_response {
    ApiResponse::Ok(data) => // 处理成功数据
    ApiResponse::Err(error) => // 处理错误
}
```

## 测试建议
更新后建议测试以下场景：
1. 超限分页参数
2. 过大的 WASM 文件
3. 过长的用户输入
4. 匿名用户调用更新操作
5. 无权限用户访问敏感数据
6. 边界时间范围
