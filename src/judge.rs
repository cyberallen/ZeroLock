//! Judge Module - Automated evaluation and settlement engine for ZeroLock platform
//! Monitors challenge states, validates attacks, and triggers automatic settlements

use crate::types::*;
use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::*;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, Storable, BoundedStorable};
use serde::Serialize;
use std::cell::RefCell;

use std::borrow::Cow;

// Memory management
type Memory = VirtualMemory<DefaultMemoryImpl>;
type EvaluationStorage = StableBTreeMap<u64, Evaluation, Memory>;
type MonitoringStorage = StableBTreeMap<u64, MonitoringState, Memory>;
type DisputeStorage = StableBTreeMap<u64, DisputeCase, Memory>;
type RuleStorage = StableBTreeMap<u64, AutomatedRule, Memory>;
type BalanceHistoryStorage = StableBTreeMap<StorableString, StorableVecBalanceSnapshot, Memory>;

// Configuration constants
const BALANCE_CHECK_INTERVAL: i64 = 60 * 1_000_000_000; // 60 seconds in nanoseconds
const MAX_BALANCE_HISTORY: usize = 1000;
const ATTACK_THRESHOLD_PERCENTAGE: u64 = 10; // 10% balance decrease
const DISPUTE_REVIEW_PERIOD: i64 = 7 * 24 * 3600 * 1_000_000_000; // 7 days

// Judge-specific types
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct MonitoringState {
    pub challenge_id: u64,
    pub target_canister: Principal,
    pub initial_balance: u64,
    pub current_balance: u64,
    pub last_check: i64,
    pub monitoring_active: bool,
    pub attack_detected: bool,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct BalanceSnapshot {
    pub canister_id: Principal,
    pub balance: u64,
    pub timestamp: i64,
    pub block_height: Option<u64>,
}

impl PartialEq for BalanceSnapshot {
    fn eq(&self, other: &Self) -> bool {
        self.canister_id == other.canister_id && self.balance == other.balance && self.timestamp == other.timestamp
    }
}

impl Eq for BalanceSnapshot {}

impl PartialOrd for BalanceSnapshot {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for BalanceSnapshot {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.timestamp.cmp(&other.timestamp)
    }
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct AutomatedRule {
    pub id: u64,
    pub name: String,
    pub condition: RuleCondition,
    pub action: RuleAction,
    pub enabled: bool,
    pub priority: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum RuleCondition {
    BalanceDecrease { threshold_percentage: u64 },
    TimeExpired,
    ManualTrigger,
    ConsensusReached { required_votes: u64 },
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum RuleAction {
    PayBounty(Principal),
    RefundCompany,
    RequireManualReview,
    ExtendDeadline(i64),
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct DisputeCase {
    pub id: u64,
    pub challenge_id: u64,
    pub attack_attempt_id: u64,
    pub disputer: Principal,
    pub reason: String,
    pub evidence: Vec<Vec<u8>>,
    pub status: DisputeStatus,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
    pub resolution: Option<String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum DisputeStatus {
    Open,
    UnderReview,
    Resolved,
    Rejected,
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
    BountyPayout(Principal),
    ChallengeExpired,
    ChallengeCancelled,
    AdminOverride(String),
}

// Global state
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    
    static EVALUATIONS: RefCell<EvaluationStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );
    
    static MONITORING_STATES: RefCell<MonitoringStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );
    
    static DISPUTES: RefCell<DisputeStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );
    
    static AUTOMATED_RULES: RefCell<RuleStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
        )
    );
    
    static BALANCE_HISTORY: RefCell<BalanceHistoryStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4)))
        )
    );
    
    static NEXT_EVALUATION_ID: RefCell<u64> = RefCell::new(1);
    static NEXT_DISPUTE_ID: RefCell<u64> = RefCell::new(1);
    static NEXT_RULE_ID: RefCell<u64> = RefCell::new(1);
    
    static BOUNTY_FACTORY_CANISTER: RefCell<Option<Principal>> = RefCell::new(None);
    static VAULT_CANISTER: RefCell<Option<Principal>> = RefCell::new(None);
}

/// Starts monitoring a challenge's target canister
/// @param challenge_id Challenge identifier
/// @param target_canister Principal of the target canister
/// @returns Success or error
#[update]
pub async fn start_monitoring(challenge_id: u64, target_canister: Principal) -> ApiResponse<()> {
    let caller = ic_cdk::caller();
    
    // Verify caller is authorized (BountyFactory)
    let bounty_factory = BOUNTY_FACTORY_CANISTER.with(|bf| *bf.borrow());
    match bounty_factory {
        Some(factory) => {
            if caller != factory {
                return ApiResponse::Err(ZeroLockError::Unauthorized(
                    "Only BountyFactory can start monitoring".to_string()
                ));
            }
        }
        None => {
            return ApiResponse::Err(ZeroLockError::InternalError(
                "BountyFactory canister not configured".to_string()
            ));
        }
    }
    
    // Check if already monitoring
    let existing_state = MONITORING_STATES.with(|states| {
        states.borrow().get(&challenge_id)
    });
    
    if let Some(existing) = existing_state {
        if existing.monitoring_active {
            return ApiResponse::Err(ZeroLockError::InvalidState(
                "Already monitoring this challenge".to_string()
            ));
        }
    }
    
    // Get initial balance
    let initial_balance = get_canister_balance(target_canister).await;
    
    let monitoring_state = MonitoringState {
        challenge_id,
        target_canister,
        initial_balance,
        current_balance: initial_balance,
        last_check: current_time(),
        monitoring_active: true,
        attack_detected: false,
    };
    
    MONITORING_STATES.with(|states| {
        states.borrow_mut().insert(challenge_id, monitoring_state)
    });
    
    // Record initial balance snapshot
    record_balance_snapshot(target_canister, initial_balance).await;
    
    ic_cdk::println!(
        "Started monitoring challenge: {}, Target: {}",
        challenge_id,
        target_canister.to_text()
    );
    ApiResponse::Ok(())
}

/// Stops monitoring a challenge
/// @param challenge_id Challenge identifier
/// @returns Success or error
#[update]
pub async fn stop_monitoring(challenge_id: u64) -> ApiResponse<()> {
    let caller = ic_cdk::caller();
    
    // Verify caller is authorized
    let bounty_factory = BOUNTY_FACTORY_CANISTER.with(|bf| *bf.borrow());
    match bounty_factory {
        Some(factory) => {
            if caller != factory {
                return ApiResponse::Err(ZeroLockError::Unauthorized(
                    "Only BountyFactory can stop monitoring".to_string()
                ));
            }
        }
        None => {
            return ApiResponse::Err(ZeroLockError::InternalError(
                "BountyFactory canister not configured".to_string()
            ));
        }
    }
    
    let state = MONITORING_STATES.with(|states| {
        states.borrow().get(&challenge_id)
    });
    
    match state {
        Some(mut state) => {
            state.monitoring_active = false;
            MONITORING_STATES.with(|states| {
                states.borrow_mut().insert(challenge_id, state)
            });
            
            ic_cdk::println!("Stopped monitoring challenge: {}", challenge_id);
            ApiResponse::Ok(())
        }
        None => ApiResponse::Err(ZeroLockError::NotFound(
            "No monitoring state found for this challenge".to_string()
        )),
    }
}

/// Evaluates an attack attempt and makes a decision
/// @param challenge_id Challenge identifier
/// @param attack_attempt Attack attempt data
/// @returns Evaluation result
#[update]
pub async fn evaluate_attack(challenge_id: u64, attack_attempt: AttackAttempt) -> ApiResponse<Evaluation> {
    let state = MONITORING_STATES.with(|states| {
        states.borrow().get(&challenge_id)
    });
    
    let state = match state {
        Some(state) => state,
        None => {
            return ApiResponse::Err(ZeroLockError::NotFound(
                "No monitoring state found for this challenge".to_string()
            ));
        }
    };
    
    if !state.monitoring_active {
        return ApiResponse::Err(ZeroLockError::InvalidState(
            "Monitoring is not active for this challenge".to_string()
        ));
    }
    
    // Check current balance
    let current_balance = get_canister_balance(state.target_canister).await;
    record_balance_snapshot(state.target_canister, current_balance).await;
    
    // Calculate balance change
    let balance_decrease = if state.initial_balance > current_balance {
        state.initial_balance - current_balance
    } else {
        0
    };
    
    let decrease_percentage = if state.initial_balance > 0 {
        (balance_decrease * 100) / state.initial_balance
    } else {
        0
    };
    
    // Make decision based on balance change
    let decision = if decrease_percentage >= ATTACK_THRESHOLD_PERCENTAGE {
        JudgeDecision::Valid
    } else {
        JudgeDecision::Invalid
    };
    
    let reasoning = format!(
        "Balance change: {}% ({} tokens). Threshold: {}%",
        decrease_percentage, balance_decrease, ATTACK_THRESHOLD_PERCENTAGE
    );
    
    // Create evaluation record
    let evaluation_id = NEXT_EVALUATION_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    });
    
    let evaluation = Evaluation {
        id: evaluation_id,
        challenge_id,
        attack_attempt_id: attack_attempt.id,
        decision: decision.clone(),
        reasoning,
        timestamp: current_time(),
        evaluator: ic_cdk::id(),
    };
    
    EVALUATIONS.with(|evaluations| {
        evaluations.borrow_mut().insert(evaluation_id, evaluation.clone())
    });
    
    // Update monitoring state
    let updated_state = MonitoringState {
        challenge_id: state.challenge_id,
        target_canister: state.target_canister,
        initial_balance: state.initial_balance,
        current_balance,
        last_check: current_time(),
        monitoring_active: state.monitoring_active,
        attack_detected: decision == JudgeDecision::Valid,
    };
    
    MONITORING_STATES.with(|states| {
        states.borrow_mut().insert(challenge_id, updated_state)
    });
    
    // Trigger settlement if attack is valid
    if decision == JudgeDecision::Valid {
        let _ = trigger_settlement(challenge_id, attack_attempt.hacker).await;
    }
    
    ic_cdk::println!(
        "Attack evaluated: Challenge={}, Decision={:?}",
        challenge_id,
        decision
    );
    ApiResponse::Ok(evaluation)
}

/// Creates a dispute for an evaluation
/// @param challenge_id Challenge identifier
/// @param attack_attempt_id Attack attempt identifier
/// @param reason Dispute reason
/// @param evidence Supporting evidence
/// @returns Dispute ID on success
#[update]
pub async fn create_dispute(
    challenge_id: u64,
    attack_attempt_id: u64,
    reason: String,
    evidence: Vec<Vec<u8>>,
) -> ApiResponse<u64> {
    let caller = ic_cdk::caller();
    
    if caller == Principal::anonymous() {
        return ApiResponse::Err(ZeroLockError::Unauthorized(
            "Anonymous principals cannot create disputes".to_string()
        ));
    }
    
    if reason.is_empty() {
        return ApiResponse::Err(ZeroLockError::InvalidInput(
            "Dispute reason cannot be empty".to_string()
        ));
    }
    
    let dispute_id = NEXT_DISPUTE_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    });
    
    let dispute = DisputeCase {
        id: dispute_id,
        challenge_id,
        attack_attempt_id,
        disputer: caller,
        reason,
        evidence,
        status: DisputeStatus::Open,
        created_at: current_time(),
        resolved_at: None,
        resolution: None,
    };
    
    DISPUTES.with(|disputes| {
        disputes.borrow_mut().insert(dispute_id, dispute)
    });
    
    ic_cdk::println!(
        "Dispute created: ID={}, Challenge={}",
        dispute_id,
        challenge_id
    );
    ApiResponse::Ok(dispute_id)
}

/// Resolves a dispute (admin function)
/// @param dispute_id Dispute identifier
/// @param resolution Resolution decision
/// @param resolution_text Explanation of resolution
/// @returns Success or error
#[update]
pub async fn resolve_dispute(
    dispute_id: u64,
    resolution: DisputeStatus,
    resolution_text: String,
) -> ApiResponse<()> {
    // In production, this should be restricted to authorized judges/admins
    
    let dispute = DISPUTES.with(|disputes| {
        disputes.borrow().get(&dispute_id)
    });
    
    let dispute = match dispute {
        Some(dispute) => dispute,
        None => {
            return ApiResponse::Err(ZeroLockError::NotFound(
                "Dispute not found".to_string()
            ));
        }
    };
    
    if dispute.status != DisputeStatus::Open && dispute.status != DisputeStatus::UnderReview {
        return ApiResponse::Err(ZeroLockError::InvalidState(
            "Dispute is already resolved".to_string()
        ));
    }
    
    let updated_dispute = DisputeCase {
        id: dispute.id,
        challenge_id: dispute.challenge_id,
        attack_attempt_id: dispute.attack_attempt_id,
        disputer: dispute.disputer,
        reason: dispute.reason,
        evidence: dispute.evidence,
        status: resolution.clone(),
        created_at: dispute.created_at,
        resolved_at: Some(current_time()),
        resolution: Some(resolution_text),
    };
    
    DISPUTES.with(|disputes| {
        disputes.borrow_mut().insert(dispute_id, updated_dispute)
    });
    
    ic_cdk::println!(
        "Dispute resolved: ID={}, Resolution={:?}",
        dispute_id,
        resolution
    );
    ApiResponse::Ok(())
}

/// Gets monitoring state for a challenge
/// @param challenge_id Challenge identifier
/// @returns Monitoring state
#[query]
pub fn get_monitoring_state(challenge_id: u64) -> ApiResponse<MonitoringState> {
    MONITORING_STATES.with(|states| {
        match states.borrow().get(&challenge_id) {
            Some(state) => ApiResponse::Ok(state),
            None => ApiResponse::Err(ZeroLockError::NotFound(
                "No monitoring state found".to_string()
            )),
        }
    })
}

/// Gets evaluation history for a challenge
/// @param challenge_id Challenge identifier
/// @returns Array of evaluations
#[query]
pub fn get_evaluations(challenge_id: u64) -> Vec<Evaluation> {
    EVALUATIONS.with(|evaluations| {
        let mut challenge_evaluations: Vec<Evaluation> = evaluations
            .borrow()
            .iter()
            .filter_map(|(_, evaluation)| {
                if evaluation.challenge_id == challenge_id {
                    Some(evaluation)
                } else {
                    None
                }
            })
            .collect();
        
        // Sort by timestamp (newest first)
        challenge_evaluations.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        challenge_evaluations
    })
}

/// Gets balance history for a canister
/// @param canister_id Canister principal
/// @param limit Maximum number of snapshots to return
/// @returns Array of balance snapshots
#[query]
pub fn get_balance_history(canister_id: Principal, limit: u64) -> Vec<BalanceSnapshot> {
    let key = StorableString(canister_id.to_text());
    BALANCE_HISTORY.with(|history| {
        match history.borrow().get(&key) {
            Some(snapshots) => {
                let snapshots = &snapshots.0;
                let max_limit = std::cmp::min(limit as usize, snapshots.len());
                if max_limit == 0 {
                    return Vec::new();
                }
                let start = snapshots.len() - max_limit;
                snapshots[start..].to_vec()
            }
            None => Vec::new(),
        }
    })
}

/// Gets open disputes
/// @returns Array of open disputes
#[query]
pub fn get_open_disputes() -> Vec<DisputeCase> {
    DISPUTES.with(|disputes| {
        let mut open_disputes: Vec<DisputeCase> = disputes
            .borrow()
            .iter()
            .filter_map(|(_, dispute)| {
                if dispute.status == DisputeStatus::Open || dispute.status == DisputeStatus::UnderReview {
                    Some(dispute)
                } else {
                    None
                }
            })
            .collect();
        
        // Sort by creation time (newest first)
        open_disputes.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        open_disputes
    })
}

/// Sets the BountyFactory canister reference
#[update]
pub fn set_bounty_factory(canister: Principal) -> ApiResponse<()> {
    // In production, this should be restricted to governance
    BOUNTY_FACTORY_CANISTER.with(|bf| *bf.borrow_mut() = Some(canister));
    ic_cdk::println!("BountyFactory canister set: {}", canister.to_text());
    ApiResponse::Ok(())
}

/// Sets the Vault canister reference
#[update]
pub fn set_vault_canister(canister: Principal) -> ApiResponse<()> {
    // In production, this should be restricted to governance
    VAULT_CANISTER.with(|vc| *vc.borrow_mut() = Some(canister));
    ic_cdk::println!("Vault canister set: {}", canister.to_text());
    ApiResponse::Ok(())
}

/// Gets configuration information
#[query]
pub fn get_config() -> JudgeConfig {
    let bounty_factory = BOUNTY_FACTORY_CANISTER.with(|bf| *bf.borrow());
    let vault = VAULT_CANISTER.with(|vc| *vc.borrow());
    
    JudgeConfig {
        bounty_factory,
        vault,
        balance_check_interval: BALANCE_CHECK_INTERVAL,
        attack_threshold: ATTACK_THRESHOLD_PERCENTAGE,
    }
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct JudgeConfig {
    pub bounty_factory: Option<Principal>,
    pub vault: Option<Principal>,
    pub balance_check_interval: i64,
    pub attack_threshold: u64,
}

// Private helper functions

/// Performs periodic monitoring checks
pub async fn perform_periodic_checks() {
    let current_time = current_time();
    
    let states: Vec<(u64, MonitoringState)> = MONITORING_STATES.with(|states| {
        states.borrow().iter().collect()
    });
    
    for (challenge_id, state) in states {
        if state.monitoring_active && (current_time - state.last_check) >= BALANCE_CHECK_INTERVAL {
            let current_balance = get_canister_balance(state.target_canister).await;
            record_balance_snapshot(state.target_canister, current_balance).await;
            
            // Check for significant balance changes
            if state.initial_balance > current_balance {
                let decrease = state.initial_balance - current_balance;
                let decrease_percentage = (decrease * 100) / state.initial_balance;
                
                if decrease_percentage >= ATTACK_THRESHOLD_PERCENTAGE && !state.attack_detected {
                    ic_cdk::println!("Potential attack detected on challenge {}", challenge_id);
                    // Could trigger additional verification here
                }
            }
            
            // Update monitoring state
            let updated_state = MonitoringState {
                challenge_id: state.challenge_id,
                target_canister: state.target_canister,
                initial_balance: state.initial_balance,
                current_balance,
                last_check: current_time,
                monitoring_active: state.monitoring_active,
                attack_detected: state.attack_detected,
            };
            
            MONITORING_STATES.with(|states| {
                states.borrow_mut().insert(challenge_id, updated_state)
            });
        }
    }
}

/// Gets the current balance of a canister
/// Note: This is a simplified implementation. In practice, this would
/// interact with the ICP ledger or the canister's balance query method
async fn get_canister_balance(canister_id: Principal) -> u64 {
    // Simplified implementation - in reality this would query the actual balance
    // For demonstration purposes, we'll return a mock value
    // In production, this would make an inter-canister call to get the balance
    1_000_000 // Mock balance
}

/// Records a balance snapshot for historical tracking
async fn record_balance_snapshot(canister_id: Principal, balance: u64) {
    let key = StorableString(canister_id.to_text());
    let snapshot = BalanceSnapshot {
        canister_id,
        balance,
        timestamp: current_time(),
        block_height: None, // Could be populated with actual block height
    };
    
    BALANCE_HISTORY.with(|history| {
        let mut history = history.borrow_mut();
        let mut current_history = history.get(&key).unwrap_or_default();
        
        if current_history.0.len() >= MAX_BALANCE_HISTORY {
            // Remove oldest entry
            current_history.0.remove(0);
        }
        
        current_history.0.push(snapshot);
        history.insert(key, current_history);
    });
}

/// Triggers settlement through the Vault canister
async fn trigger_settlement(challenge_id: u64, winner: Principal) -> ApiResponse<()> {
    let vault_canister = VAULT_CANISTER.with(|vc| *vc.borrow());
    
    match vault_canister {
        Some(_vault) => {
            // In a real implementation, this would make an inter-canister call
            // to the vault canister to unlock funds
            ic_cdk::println!(
                "Settlement triggered for challenge {} to winner {}",
                challenge_id,
                winner.to_text()
            );
            ApiResponse::Ok(())
        }
        None => ApiResponse::Err(ZeroLockError::InternalError(
            "Vault canister not configured".to_string()
        )),
    }
}

/// Periodic monitoring function (called manually or by external scheduler)
pub async fn judge_heartbeat() {
    perform_periodic_checks().await;
}

// Storable implementations for stable storage

impl Storable for MonitoringState {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for MonitoringState {
    const MAX_SIZE: u32 = 1024;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for BalanceSnapshot {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for BalanceSnapshot {
    const MAX_SIZE: u32 = 512;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for AutomatedRule {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for AutomatedRule {
    const MAX_SIZE: u32 = 2048;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for DisputeCase {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for DisputeCase {
    const MAX_SIZE: u32 = 4096;
    const IS_FIXED_SIZE: bool = false;
}

// Vec<BalanceSnapshot> wrapper for stable storage
#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Default)]
pub struct StorableVecBalanceSnapshot(pub Vec<BalanceSnapshot>);

impl Storable for StorableVecBalanceSnapshot {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for StorableVecBalanceSnapshot {
    const MAX_SIZE: u32 = 16384;
    const IS_FIXED_SIZE: bool = false;
}