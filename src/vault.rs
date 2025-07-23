//! Vault Module - Secure asset management for ZeroLock platform
//! Handles fund locking, automatic settlements, and multi-token support

use crate::types::*;
use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::*;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, Storable, BoundedStorable};
use serde::Serialize;
use std::cell::RefCell;


// Memory management
type Memory = VirtualMemory<DefaultMemoryImpl>;
type TransactionStorage = StableBTreeMap<u64, Transaction, Memory>;
type BalanceStorage = StableBTreeMap<StorableString, Balance, Memory>;
type LockStorage = StableBTreeMap<u64, LockInfo, Memory>;
type AuthorizedCanisterStorage = StableBTreeMap<u64, StorablePrincipal, Memory>;

// Configuration constants
const PLATFORM_FEE_BASIS_POINTS: u64 = 250; // 2.5%
const MAX_LOCK_DURATION: i64 = 30 * 24 * 3600 * 1_000_000_000; // 30 days in nanoseconds
const MIN_LOCK_AMOUNT: u64 = 1_000_000; // 0.01 ICP in e8s

// Vault-specific types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct LockRequest {
    pub challenge_id: u64,
    pub company: Principal,
    pub amount: u64,
    pub token_type: TokenType,
    pub duration: i64, // Lock duration in nanoseconds
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UnlockRequest {
    pub challenge_id: u64,
    pub recipient: Principal,
    pub amount: u64,
    pub reason: UnlockReason,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum UnlockReason {
    BountyPayout(Principal), // Hacker who earned the bounty
    ChallengeExpired,
    ChallengeCancelled,
    AdminOverride(String),
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, Default)]
pub struct VaultStats {
    pub total_locked: u64,
    pub total_transactions: u64,
    pub active_locks: u64,
    pub total_volume: u64,
}

// Lock information
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct LockInfo {
    pub challenge_id: u64,
    pub company: Principal,
    pub amount: u64,
    pub token_type: TokenType,
    pub locked_at: i64,
    pub expires_at: i64,
    pub status: LockStatus,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum LockStatus {
    Active,
    Released,
    Expired,
}

// Wrapper for Principal to implement BoundedStorable
#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct StorablePrincipal(pub Principal);

impl From<Principal> for StorablePrincipal {
    fn from(principal: Principal) -> Self {
        StorablePrincipal(principal)
    }
}

impl From<StorablePrincipal> for Principal {
    fn from(storable: StorablePrincipal) -> Self {
        storable.0
    }
}

impl Storable for StorablePrincipal {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        std::borrow::Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for StorablePrincipal {
    const MAX_SIZE: u32 = 29;
    const IS_FIXED_SIZE: bool = false;
}

// Global state
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    
    static TRANSACTIONS: RefCell<TransactionStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );
    
    static BALANCES: RefCell<BalanceStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );
    
    static LOCKS: RefCell<LockStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );
    
    static AUTHORIZED_CANISTERS: RefCell<AuthorizedCanisterStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
        )
    );
    
    static NEXT_TRANSACTION_ID: RefCell<u64> = RefCell::new(1);
    static NEXT_CANISTER_ID: RefCell<u64> = RefCell::new(1);
    static PLATFORM_FEE_RECIPIENT: RefCell<Principal> = RefCell::new(Principal::anonymous());
    static IS_PAUSED: RefCell<bool> = RefCell::new(false);
}

/// Deposits funds into the vault
/// @param token_type Type of token being deposited
/// @param amount Amount to deposit
/// @returns Transaction ID on success
#[update]
pub async fn deposit(token_type: TokenType, amount: u64) -> ApiResponse<u64> {
    let caller = ic_cdk::caller();
    
    if caller == Principal::anonymous() {
        return ApiResponse::Err(ZeroLockError::Unauthorized(
            "Anonymous principals cannot deposit".to_string()
        ));
    }
    
    if amount == 0 {
        return ApiResponse::Err(ZeroLockError::InvalidInput(
            "Deposit amount must be greater than zero".to_string()
        ));
    }
    
    // Check if vault is paused
    if IS_PAUSED.with(|p| *p.borrow()) {
        return ApiResponse::Err(ZeroLockError::InvalidState(
            "Vault operations are currently paused".to_string()
        ));
    }
    
    // In a real implementation, this would interact with ICP ledger or ICRC-1 tokens
    // For now, we'll simulate the deposit
    
    let balance_key = make_balance_key(&caller, &token_type);
    let current_balance = BALANCES.with(|balances| {
        balances.borrow().get(&balance_key).unwrap_or(Balance {
            owner: caller,
            token_type: token_type.clone(),
            available: 0,
            locked: 0,
            total: 0,
        })
    });
    
    let new_balance = Balance {
        owner: current_balance.owner,
        token_type: current_balance.token_type,
        available: current_balance.available + amount,
        locked: current_balance.locked,
        total: current_balance.total + amount,
    };
    
    BALANCES.with(|balances| {
        balances.borrow_mut().insert(balance_key, new_balance)
    });
    
    // Record transaction
    let transaction_id = NEXT_TRANSACTION_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    });
    
    let transaction = Transaction {
        id: transaction_id,
        transaction_type: TransactionType::Lock, // Using Lock as deposit type
        challenge_id: 0, // No specific challenge for deposits
        from: caller,
        to: ic_cdk::id(),
        amount,
        token_type,
        timestamp: current_time(),
        status: TransactionStatus::Completed,
    };
    
    TRANSACTIONS.with(|transactions| {
        transactions.borrow_mut().insert(transaction_id, transaction)
    });
    
    ic_cdk::println!("Deposit completed: User={}, Amount={}", caller.to_text(), amount);
    ApiResponse::Ok(transaction_id)
}

/// Locks funds for a challenge
/// @param request Lock request parameters
/// @returns Success or error
#[update]
pub async fn lock_funds(request: LockRequest) -> ApiResponse<()> {
    let caller = ic_cdk::caller();
    
    // Verify caller is authorized (BountyFactory)
    if !is_authorized_canister(&caller) {
        return ApiResponse::Err(ZeroLockError::Unauthorized(
            "Only authorized canisters can lock funds".to_string()
        ));
    }
    
    // Check if vault is paused
    if IS_PAUSED.with(|p| *p.borrow()) {
        return ApiResponse::Err(ZeroLockError::InvalidState(
            "Vault operations are currently paused".to_string()
        ));
    }
    
    // Validate request
    if request.amount < MIN_LOCK_AMOUNT {
        return ApiResponse::Err(ZeroLockError::InvalidInput(
            "Lock amount below minimum threshold".to_string()
        ));
    }
    
    if request.duration > MAX_LOCK_DURATION {
        return ApiResponse::Err(ZeroLockError::InvalidInput(
            "Lock duration exceeds maximum allowed".to_string()
        ));
    }
    
    // Check if challenge already has locked funds
    let existing_lock = LOCKS.with(|locks| locks.borrow().get(&request.challenge_id));
    if let Some(lock_info) = existing_lock {
        if lock_info.status == LockStatus::Active {
            return ApiResponse::Err(ZeroLockError::InvalidState(
                "Funds already locked for this challenge".to_string()
            ));
        }
    }
    
    // Check company balance
    let balance_key = make_balance_key(&request.company, &request.token_type);
    let balance = BALANCES.with(|balances| balances.borrow().get(&balance_key));
    
    let balance = match balance {
        Some(b) => b,
        None => {
            return ApiResponse::Err(ZeroLockError::InsufficientFunds(
                "No balance found for this token type".to_string()
            ));
        }
    };
    
    if balance.available < request.amount {
        return ApiResponse::Err(ZeroLockError::InsufficientFunds(
            "Insufficient available balance".to_string()
        ));
    }
    
    // Update balance (move from available to locked)
    let updated_balance = Balance {
        owner: balance.owner,
        token_type: balance.token_type,
        available: balance.available - request.amount,
        locked: balance.locked + request.amount,
        total: balance.total,
    };
    
    BALANCES.with(|balances| {
        balances.borrow_mut().insert(balance_key, updated_balance)
    });
    
    // Create lock record
    let current_time = current_time();
    let lock_info = LockInfo {
        challenge_id: request.challenge_id,
        company: request.company,
        amount: request.amount,
        token_type: request.token_type.clone(),
        locked_at: current_time,
        expires_at: current_time + request.duration,
        status: LockStatus::Active,
    };
    
    LOCKS.with(|locks| {
        locks.borrow_mut().insert(request.challenge_id, lock_info)
    });
    
    // Record transaction
    let transaction_id = NEXT_TRANSACTION_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    });
    
    let transaction = Transaction {
        id: transaction_id,
        transaction_type: TransactionType::Lock,
        challenge_id: request.challenge_id,
        from: request.company,
        to: ic_cdk::id(),
        amount: request.amount,
        token_type: request.token_type,
        timestamp: current_time,
        status: TransactionStatus::Completed,
    };
    
    TRANSACTIONS.with(|transactions| {
        transactions.borrow_mut().insert(transaction_id, transaction)
    });
    
    ic_cdk::println!(
        "Funds locked: Challenge={}, Amount={}",
        request.challenge_id,
        request.amount
    );
    ApiResponse::Ok(())
}

/// Unlocks and transfers funds based on challenge outcome
/// @param request Unlock request parameters
/// @returns Success or error
#[update]
pub async fn unlock_funds(request: UnlockRequest) -> ApiResponse<()> {
    let caller = ic_cdk::caller();
    
    // Verify caller is authorized (Judge canister)
    if !is_authorized_canister(&caller) {
        return ApiResponse::Err(ZeroLockError::Unauthorized(
            "Only authorized canisters can unlock funds".to_string()
        ));
    }
    
    // Check if vault is paused
    if IS_PAUSED.with(|p| *p.borrow()) {
        return ApiResponse::Err(ZeroLockError::InvalidState(
            "Vault operations are currently paused".to_string()
        ));
    }
    
    // Get lock information
    let lock_info = LOCKS.with(|locks| locks.borrow().get(&request.challenge_id));
    
    let lock_info = match lock_info {
        Some(info) => info,
        None => {
            return ApiResponse::Err(ZeroLockError::NotFound(
                "No locked funds found for this challenge".to_string()
            ));
        }
    };
    
    if lock_info.status != LockStatus::Active {
        return ApiResponse::Err(ZeroLockError::InvalidState(
            "Lock is not active".to_string()
        ));
    }
    
    if request.amount > lock_info.amount {
        return ApiResponse::Err(ZeroLockError::InvalidInput(
            "Unlock amount exceeds locked amount".to_string()
        ));
    }
    
    // Calculate platform fee and net payout
    let (net_amount, platform_fee) = match &request.reason {
        UnlockReason::BountyPayout(_) => {
            let fee = (request.amount * PLATFORM_FEE_BASIS_POINTS) / 10000;
            (request.amount - fee, fee)
        }
        _ => (request.amount, 0), // No fee for refunds/cancellations
    };
    
    // Update company balance (reduce locked amount)
    let company_balance_key = make_balance_key(&lock_info.company, &lock_info.token_type);
    let company_balance = BALANCES.with(|balances| balances.borrow().get(&company_balance_key));
    
    let company_balance = match company_balance {
        Some(b) => b,
        None => {
            return ApiResponse::Err(ZeroLockError::InternalError(
                "Company balance not found".to_string()
            ));
        }
    };
    
    let updated_company_balance = Balance {
        owner: company_balance.owner,
        token_type: company_balance.token_type,
        available: company_balance.available,
        locked: company_balance.locked - request.amount,
        total: company_balance.total - request.amount,
    };
    
    BALANCES.with(|balances| {
        balances.borrow_mut().insert(company_balance_key, updated_company_balance)
    });
    
    // Transfer to recipient
    if net_amount > 0 {
        let recipient_balance_key = make_balance_key(&request.recipient, &lock_info.token_type);
        let recipient_balance = BALANCES.with(|balances| {
            balances.borrow().get(&recipient_balance_key).unwrap_or(Balance {
                owner: request.recipient,
                token_type: lock_info.token_type.clone(),
                available: 0,
                locked: 0,
                total: 0,
            })
        });
        
        let updated_recipient_balance = Balance {
            owner: recipient_balance.owner,
            token_type: recipient_balance.token_type,
            available: recipient_balance.available + net_amount,
            locked: recipient_balance.locked,
            total: recipient_balance.total + net_amount,
        };
        
        BALANCES.with(|balances| {
            balances.borrow_mut().insert(recipient_balance_key, updated_recipient_balance)
        });
    }
    
    // Handle platform fee
    if platform_fee > 0 {
        let platform_fee_recipient = PLATFORM_FEE_RECIPIENT.with(|p| *p.borrow());
        let fee_balance_key = make_balance_key(&platform_fee_recipient, &lock_info.token_type);
        let fee_balance = BALANCES.with(|balances| {
            balances.borrow().get(&fee_balance_key).unwrap_or(Balance {
                owner: platform_fee_recipient,
                token_type: lock_info.token_type.clone(),
                available: 0,
                locked: 0,
                total: 0,
            })
        });
        
        let updated_fee_balance = Balance {
            owner: fee_balance.owner,
            token_type: fee_balance.token_type,
            available: fee_balance.available + platform_fee,
            locked: fee_balance.locked,
            total: fee_balance.total + platform_fee,
        };
        
        BALANCES.with(|balances| {
            balances.borrow_mut().insert(fee_balance_key, updated_fee_balance)
        });
    }
    
    // Update lock status
    let updated_lock = LockInfo {
        challenge_id: lock_info.challenge_id,
        company: lock_info.company,
        amount: lock_info.amount,
        token_type: lock_info.token_type.clone(),
        locked_at: lock_info.locked_at,
        expires_at: lock_info.expires_at,
        status: LockStatus::Released,
    };
    
    LOCKS.with(|locks| {
        locks.borrow_mut().insert(request.challenge_id, updated_lock)
    });
    
    // Record transactions
    let current_time = current_time();
    
    // Main payout transaction
    if net_amount > 0 {
        let payout_transaction_id = NEXT_TRANSACTION_ID.with(|id| {
            let mut id = id.borrow_mut();
            let current = *id;
            *id += 1;
            current
        });
        
        let payout_transaction = Transaction {
            id: payout_transaction_id,
            transaction_type: TransactionType::Payout,
            challenge_id: request.challenge_id,
            from: lock_info.company,
            to: request.recipient,
            amount: net_amount,
            token_type: lock_info.token_type.clone(),
            timestamp: current_time,
            status: TransactionStatus::Completed,
        };
        
        TRANSACTIONS.with(|transactions| {
            transactions.borrow_mut().insert(payout_transaction_id, payout_transaction)
        });
    }
    
    // Platform fee transaction
    if platform_fee > 0 {
        let fee_transaction_id = NEXT_TRANSACTION_ID.with(|id| {
            let mut id = id.borrow_mut();
            let current = *id;
            *id += 1;
            current
        });
        
        let platform_fee_recipient = PLATFORM_FEE_RECIPIENT.with(|p| *p.borrow());
        let fee_transaction = Transaction {
            id: fee_transaction_id,
            transaction_type: TransactionType::Fee,
            challenge_id: request.challenge_id,
            from: lock_info.company,
            to: platform_fee_recipient,
            amount: platform_fee,
            token_type: lock_info.token_type,
            timestamp: current_time,
            status: TransactionStatus::Completed,
        };
        
        TRANSACTIONS.with(|transactions| {
            transactions.borrow_mut().insert(fee_transaction_id, fee_transaction)
        });
    }
    
    ic_cdk::println!(
        "Funds unlocked: Challenge={}, Recipient={}, Amount={}",
        request.challenge_id,
        request.recipient.to_text(),
        net_amount
    );
    ApiResponse::Ok(())
}

/// Gets balance for a user and token type
/// @param user Principal of the user
/// @param token_type Type of token
/// @returns Balance information
#[query]
pub fn get_balance(user: Principal, token_type: TokenType) -> ApiResponse<Balance> {
    let balance_key = make_balance_key(&user, &token_type);
    let balance = BALANCES.with(|balances| {
        balances.borrow().get(&balance_key).unwrap_or(Balance {
            owner: user,
            token_type,
            available: 0,
            locked: 0,
            total: 0,
        })
    });
    
    ApiResponse::Ok(balance)
}

/// Gets lock information for a challenge
/// @param challenge_id Challenge identifier
/// @returns Lock information
#[query]
pub fn get_lock_info(challenge_id: u64) -> ApiResponse<LockInfo> {
    LOCKS.with(|locks| {
        match locks.borrow().get(&challenge_id) {
            Some(lock_info) => ApiResponse::Ok(lock_info),
            None => ApiResponse::Err(ZeroLockError::NotFound(
                "No lock found for this challenge".to_string()
            )),
        }
    })
}

/// Gets transaction history for a user
/// @param user Principal of the user
/// @param offset Pagination offset
/// @param limit Maximum number of results
/// @returns Array of transactions
#[query]
pub fn get_transaction_history(user: Principal, offset: u64, limit: u64) -> Vec<Transaction> {
    let max_limit = 100;
    let actual_limit = if limit > max_limit { max_limit } else { limit };
    
    TRANSACTIONS.with(|transactions| {
        let mut user_transactions: Vec<Transaction> = transactions
            .borrow()
            .iter()
            .filter_map(|(_, transaction)| {
                if transaction.from == user || transaction.to == user {
                    Some(transaction)
                } else {
                    None
                }
            })
            .collect();
        
        // Sort by timestamp (newest first)
        user_transactions.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        // Apply pagination
        let start = offset as usize;
        if start >= user_transactions.len() {
            return Vec::new();
        }
        
        let end = std::cmp::min(start + actual_limit as usize, user_transactions.len());
        user_transactions[start..end].to_vec()
    })
}

/// Gets vault statistics
/// @returns Vault statistics
#[query]
pub fn get_vault_stats() -> VaultStats {
    let mut stats = VaultStats::default();
    
    LOCKS.with(|locks| {
        for (_, lock_info) in locks.borrow().iter() {
            if lock_info.status == LockStatus::Active {
                stats.total_locked += lock_info.amount;
                stats.active_locks += 1;
            }
        }
    });
    
    TRANSACTIONS.with(|transactions| {
        stats.total_transactions = transactions.borrow().len();
        for (_, transaction) in transactions.borrow().iter() {
            if transaction.status == TransactionStatus::Completed {
                stats.total_volume += transaction.amount;
            }
        }
    });
    
    stats
}

/// Adds an authorized canister
#[update]
pub fn add_authorized_canister(canister: Principal) -> ApiResponse<()> {
    // In production, this should be restricted to governance
    
    if is_authorized_canister(&canister) {
        return ApiResponse::Err(ZeroLockError::InvalidInput(
            "Canister is already authorized".to_string()
        ));
    }
    
    let canister_id = NEXT_CANISTER_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    });
    
    AUTHORIZED_CANISTERS.with(|canisters| {
        canisters.borrow_mut().insert(canister_id, StorablePrincipal(canister))
    });
    
    ic_cdk::println!("Authorized canister added: {}", canister.to_text());
    ApiResponse::Ok(())
}

/// Gets list of authorized canisters
#[query]
pub fn get_authorized_canisters() -> Vec<Principal> {
    AUTHORIZED_CANISTERS.with(|canisters| {
        canisters.borrow().iter().map(|(_, principal)| principal.0).collect()
    })
}

/// Emergency function to pause all operations
#[update]
pub fn set_pause_status(paused: bool) -> ApiResponse<()> {
    // In production, this should be restricted to governance
    IS_PAUSED.with(|p| *p.borrow_mut() = paused);
    ic_cdk::println!("Vault pause status set to: {}", paused);
    ApiResponse::Ok(())
}

/// Gets pause status
#[query]
pub fn is_paused() -> bool {
    IS_PAUSED.with(|p| *p.borrow())
}

/// Sets platform fee recipient
#[update]
pub fn set_platform_fee_recipient(recipient: Principal) -> ApiResponse<()> {
    // In production, this should be restricted to governance
    PLATFORM_FEE_RECIPIENT.with(|p| *p.borrow_mut() = recipient);
    ic_cdk::println!("Platform fee recipient set to: {}", recipient.to_text());
    ApiResponse::Ok(())
}

// Private helper functions

/// Creates a unique key for balance storage
fn make_balance_key(principal: &Principal, token_type: &TokenType) -> StorableString {
    let token_str = match token_type {
        TokenType::ICP => "ICP".to_string(),
        TokenType::ICRC1(p) => format!("ICRC1:{}", p.to_text()),
    };
    StorableString(format!("{}#{}", principal.to_text(), token_str))
}

/// Checks if a canister is authorized to call vault functions
fn is_authorized_canister(canister: &Principal) -> bool {
    AUTHORIZED_CANISTERS.with(|canisters| {
        canisters
            .borrow()
            .iter()
            .any(|(_, authorized)| authorized.0 == *canister)
    })
}

// Storable implementations for stable storage
use std::borrow::Cow;

impl Storable for LockInfo {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for LockInfo {
    const MAX_SIZE: u32 = 1024;
    const IS_FIXED_SIZE: bool = false;
}



impl Storable for LockStatus {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for LockStatus {
    const MAX_SIZE: u32 = 256;
    const IS_FIXED_SIZE: bool = false;
}



impl Storable for VaultStats {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for VaultStats {
    const MAX_SIZE: u32 = 512;
    const IS_FIXED_SIZE: bool = false;
}



impl Storable for UnlockReason {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for UnlockReason {
    const MAX_SIZE: u32 = 1024;
    const IS_FIXED_SIZE: bool = false;
}