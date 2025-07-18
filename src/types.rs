//! Shared types and interfaces for ZeroLock platform
//! Contains common data structures used across all canisters

use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;
use std::collections::HashMap;
use ic_stable_structures::{Storable, BoundedStorable};
use std::borrow::Cow;

// Token types supported by the platform
#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum TokenType {
    ICP,
    ICRC1(Principal),
}

// Challenge lifecycle states
#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum ChallengeStatus {
    Created,     // Challenge created but not yet active
    Active,      // Challenge is live and accepting attacks
    Completed,   // Challenge successfully completed by a hacker
    Expired,     // Challenge time limit exceeded
    Cancelled,   // Challenge cancelled by company or admin
}

// Core challenge data structure
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Challenge {
    pub id: u64,
    pub company: Principal,
    pub target_canister: Option<Principal>,
    pub wasm_code: Vec<u8>,
    pub candid_interface: String,
    pub bounty_amount: u64,
    pub token_type: TokenType,
    pub start_time: i64,
    pub end_time: i64,
    pub status: ChallengeStatus,
    pub description: String,
    pub difficulty_level: u8, // 1-5 scale
    pub created_at: i64,
    pub updated_at: i64,
}

// Attack attempt record
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct AttackAttempt {
    pub id: u64,
    pub challenge_id: u64,
    pub hacker: Principal,
    pub timestamp: i64,
    pub success: bool,
    pub proof: Option<Vec<u8>>, // Optional proof of successful attack
    pub gas_used: u64,
}

// Vault transaction types
#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum TransactionType {
    Lock,        // Lock funds for a challenge
    Unlock,      // Unlock funds (challenge cancelled/expired)
    Payout,      // Pay bounty to successful hacker
    Refund,      // Refund to company
    Fee,         // Platform fee collection
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum TransactionStatus {
    Pending,
    Completed,
    Failed,
    Cancelled,
}

// Vault transaction record
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Transaction {
    pub id: u64,
    pub transaction_type: TransactionType,
    pub challenge_id: u64,
    pub from: Principal,
    pub to: Principal,
    pub amount: u64,
    pub token_type: TokenType,
    pub timestamp: i64,
    pub status: TransactionStatus,
}

// Judge decision types
#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum JudgeDecision {
    Valid,       // Attack is valid, pay bounty
    Invalid,     // Attack is invalid, no payout
    Disputed,    // Requires manual review
    Pending,     // Still under evaluation
}

// Judge evaluation record
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Evaluation {
    pub id: u64,
    pub challenge_id: u64,
    pub attack_attempt_id: u64,
    pub decision: JudgeDecision,
    pub reasoning: String,
    pub timestamp: i64,
    pub evaluator: Principal, // Could be automated system or human judge
}

// Platform statistics
#[derive(CandidType, Deserialize, Serialize, Clone, Debug, Default)]
pub struct PlatformStats {
    pub total_challenges: u64,
    pub active_challenges: u64,
    pub completed_challenges: u64,
    pub total_bounty_paid: u64,
    pub total_bounties_paid: u64,
    pub successful_attacks: u64,
    pub total_hackers: u64,
    pub total_companies: u64,
}

// User profile types
#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum UserRole {
    Company,
    Hacker,
    Admin,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UserProfile {
    pub principal: Principal,
    pub username: String,
    pub reputation: u64,
    pub total_earned: u64,
    pub challenges_completed: u64,
    pub role: UserRole,
    pub created_at: u64,
}

// Error types used across the platform
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum ZeroLockError {
    NotFound(String),
    Unauthorized(String),
    InvalidInput(String),
    InternalError(String),
    ResourceLimit(String),
    InvalidState(String),
    InsufficientFunds(String),
    NetworkError(String),
    AlreadyExists(String),
}

// Event types for cross-canister communication
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum Event {
    ChallengeCreated { challenge_id: u64, company: Principal },
    ChallengeActivated { challenge_id: u64 },
    AttackAttempted { challenge_id: u64, hacker: Principal },
    AttackSuccessful { challenge_id: u64, hacker: Principal },
    ChallengeCompleted { challenge_id: u64, winner: Principal },
    ChallengeExpired { challenge_id: u64 },
    FundsLocked { challenge_id: u64, amount: u64 },
    BountyPaid { challenge_id: u64, recipient: Principal, amount: u64 },
}

// Configuration types
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct PlatformConfig {
    pub min_bounty_amount: u64,
    pub max_challenge_duration: u64,
    pub platform_fee_percentage: u64, // Basis points (e.g., 250 = 2.5%)
    pub max_challenges_per_user: u64,
    pub reputation_threshold_for_high_value: u64,
}

impl Default for PlatformConfig {
    fn default() -> Self {
        Self {
            min_bounty_amount: 1_000_000, // 0.01 ICP
            max_challenge_duration: 30 * 24 * 60 * 60 * 1_000_000_000, // 30 days in nanoseconds
            platform_fee_percentage: 250, // 2.5%
            max_challenges_per_user: 10,
            reputation_threshold_for_high_value: 1000,
        }
    }
}

// Pagination helper
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct PaginationParams {
    pub offset: u64,
    pub limit: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct PaginatedResult<T> {
    pub data: Vec<T>,
    pub total: u64,
    pub offset: u64,
    pub limit: u64,
    pub has_more: bool,
}

// Filter types for queries
#[derive(CandidType, Deserialize, Serialize, Clone, Debug, Default)]
pub struct ChallengeFilter {
    pub status: Option<ChallengeStatus>,
    pub company: Option<Principal>,
    pub difficulty_level: Option<u8>,
    pub token_type: Option<TokenType>,
    pub min_bounty: Option<u64>,
    pub max_bounty: Option<u64>,
}

// Sorting options
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum SortOrder {
    Asc,
    Desc,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum ChallengeSortBy {
    CreatedAt,
    BountyAmount,
    EndTime,
    DifficultyLevel,
}

// API response wrapper
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum ApiResponse<T> {
    Ok(T),
    Err(ZeroLockError),
}

impl<T> From<Result<T, ZeroLockError>> for ApiResponse<T> {
    fn from(result: Result<T, ZeroLockError>) -> Self {
        match result {
            Ok(value) => ApiResponse::Ok(value),
            Err(error) => ApiResponse::Err(error),
        }
    }
}

// Storable implementations for stable storage
impl Storable for Challenge {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for Challenge {
    const MAX_SIZE: u32 = 2048;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for UserProfile {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for UserProfile {
    const MAX_SIZE: u32 = 512;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for Transaction {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for Transaction {
    const MAX_SIZE: u32 = 1024;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for AttackAttempt {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for AttackAttempt {
    const MAX_SIZE: u32 = 1024;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for Evaluation {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for Evaluation {
    const MAX_SIZE: u32 = 1024;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for Principal {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Borrowed(self.as_slice())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Principal::from_slice(&bytes)
    }
}

impl BoundedStorable for Principal {
    const MAX_SIZE: u32 = 29; // Principal max size is 29 bytes
    const IS_FIXED_SIZE: bool = false;
}

// String wrapper for stable storage
#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct StorableString(pub String);

impl Storable for StorableString {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Borrowed(self.0.as_bytes())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        StorableString(String::from_utf8(bytes.into_owned()).unwrap())
    }
}

impl BoundedStorable for StorableString {
    const MAX_SIZE: u32 = 1024;
    const IS_FIXED_SIZE: bool = false;
}

// Vec<u64> wrapper for stable storage
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct StorableVecU64(pub Vec<u64>);

impl Storable for StorableVecU64 {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut bytes = Vec::new();
        for &item in &self.0 {
            bytes.extend_from_slice(&item.to_le_bytes());
        }
        Cow::Owned(bytes)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        let vec = bytes.chunks_exact(8)
            .map(|chunk| u64::from_le_bytes(chunk.try_into().unwrap()))
            .collect();
        StorableVecU64(vec)
    }
}

impl BoundedStorable for StorableVecU64 {
    const MAX_SIZE: u32 = 8192;
    const IS_FIXED_SIZE: bool = false;
}

// Utility functions
pub fn is_valid_difficulty_level(level: u8) -> bool {
    level >= 1 && level <= 5
}

pub fn is_valid_token_type(token: &TokenType) -> bool {
    match token {
        TokenType::ICP => true,
        TokenType::ICRC1(_) => true,
    }
}

pub fn is_final_status(status: &ChallengeStatus) -> bool {
    matches!(status, ChallengeStatus::Completed | ChallengeStatus::Expired | ChallengeStatus::Cancelled)
}

pub fn can_transition_to(from: &ChallengeStatus, to: &ChallengeStatus) -> bool {
    match (from, to) {
        (ChallengeStatus::Created, ChallengeStatus::Active) => true,
        (ChallengeStatus::Created, ChallengeStatus::Cancelled) => true,
        (ChallengeStatus::Active, ChallengeStatus::Completed) => true,
        (ChallengeStatus::Active, ChallengeStatus::Expired) => true,
        (ChallengeStatus::Active, ChallengeStatus::Cancelled) => true,
        (_, _) => from == to, // Allow setting same status
    }
}

// Helper type for storing data in stable memory
pub type StableHashMap<K, V> = HashMap<K, V>;

// Time utilities
pub fn current_time() -> i64 {
    ic_cdk::api::time() as i64
}

pub fn time_from_now(duration_ns: u64) -> i64 {
    current_time() + duration_ns as i64
}