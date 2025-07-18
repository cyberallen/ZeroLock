//! BountyFactory Module - Core module for ZeroLock security bounty platform
//! Manages the complete lifecycle of security challenges on ICP blockchain

use crate::types::*;
use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::management_canister::main::{
    create_canister, install_code, CanisterSettings, CreateCanisterArgument,
    InstallCodeArgument, CanisterInstallMode,
};
use ic_cdk_macros::*;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};
use serde::Serialize;
use std::cell::RefCell;
use std::collections::HashMap;

// Memory management
type Memory = VirtualMemory<DefaultMemoryImpl>;
type ChallengeStorage = StableBTreeMap<u64, Challenge, Memory>;
type AdminStorage = StableBTreeMap<u64, Principal, Memory>;

// Configuration constants
const MAX_CHALLENGES_PER_USER: u64 = 10;
const MIN_BOUNTY_AMOUNT: u64 = 1_000_000; // 0.01 ICP in e8s
const MAX_DURATION_HOURS: u64 = 720; // 30 days
const MIN_DURATION_HOURS: u64 = 24; // 1 day
const MAX_WASM_SIZE: usize = 2_000_000; // 2MB
const MAX_DESCRIPTION_LENGTH: usize = 1000;

// Request types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CreateChallengeRequest {
    pub wasm_code: Vec<u8>,
    pub candid_interface: String,
    pub bounty_amount: u64,
    pub duration_hours: u64,
    pub token_type: TokenType,
    pub description: String,
    pub difficulty_level: u8,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, Default)]
pub struct ChallengeStats {
    pub total: u64,
    pub active: u64,
    pub completed: u64,
    pub expired: u64,
    pub cancelled: u64,
}

// Global state
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    
    static CHALLENGES: RefCell<ChallengeStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );
    
    static ADMINS: RefCell<AdminStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );
    
    static NEXT_CHALLENGE_ID: RefCell<u64> = RefCell::new(1);
    static NEXT_ADMIN_ID: RefCell<u64> = RefCell::new(1);
}

/// Creates a new security challenge
/// @param request Challenge creation parameters
/// @returns Challenge ID on success, error on failure
#[update]
pub async fn create_challenge(request: CreateChallengeRequest) -> ApiResponse<u64> {
    let caller = ic_cdk::caller();
    
    // Validate caller is not anonymous
    if caller == Principal::anonymous() {
        return ApiResponse::Err(ZeroLockError::Unauthorized(
            "Anonymous principals cannot create challenges".to_string()
        ));
    }
    
    // Validate input parameters
    if let Err(error) = validate_challenge_request(&request) {
        return ApiResponse::Err(error);
    }
    
    // Check user challenge limit
    let user_challenge_count = count_user_challenges(&caller);
    if user_challenge_count >= MAX_CHALLENGES_PER_USER {
        return ApiResponse::Err(ZeroLockError::ResourceLimit(
            "Maximum challenges per user exceeded".to_string()
        ));
    }
    
    let current_time = current_time();
    let challenge_id = NEXT_CHALLENGE_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    });
    
    let challenge = Challenge {
        id: challenge_id,
        company: caller,
        target_canister: None,
        wasm_code: request.wasm_code,
        candid_interface: request.candid_interface,
        bounty_amount: request.bounty_amount,
        token_type: request.token_type,
        start_time: current_time,
        end_time: current_time + (request.duration_hours * 3600 * 1_000_000_000) as i64, // Convert hours to nanoseconds
        status: ChallengeStatus::Created,
        description: request.description,
        difficulty_level: request.difficulty_level,
        created_at: current_time,
        updated_at: current_time,
    };
    
    CHALLENGES.with(|challenges| {
        challenges.borrow_mut().insert(challenge_id, challenge)
    });
    
    ic_cdk::println!("Challenge created: ID={}, Company={}", challenge_id, caller.to_text());
    
    ApiResponse::Ok(challenge_id)
}

/// Retrieves a challenge by ID
/// @param id Challenge identifier
/// @returns Challenge data or error if not found
#[query]
pub fn get_challenge(id: u64) -> ApiResponse<Challenge> {
    CHALLENGES.with(|challenges| {
        match challenges.borrow().get(&id) {
            Some(challenge) => ApiResponse::Ok(challenge),
            None => ApiResponse::Err(ZeroLockError::NotFound("Challenge not found".to_string())),
        }
    })
}

/// Lists challenges with optional filtering and pagination
/// @param status Optional status filter
/// @param offset Pagination offset
/// @param limit Maximum number of results
/// @returns Array of challenges
#[query]
pub fn list_challenges(
    status: Option<ChallengeStatus>,
    offset: u64,
    limit: u64,
) -> Vec<Challenge> {
    let max_limit = 100;
    let actual_limit = if limit > max_limit { max_limit } else { limit };
    
    CHALLENGES.with(|challenges| {
        let mut all_challenges: Vec<Challenge> = challenges
            .borrow()
            .iter()
            .map(|(_, challenge)| challenge)
            .collect();
        
        // Filter by status if provided
        if let Some(filter_status) = status {
            all_challenges.retain(|c| c.status == filter_status);
        }
        
        // Sort by creation time (newest first)
        all_challenges.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        
        // Apply pagination
        let start = offset as usize;
        if start >= all_challenges.len() {
            return Vec::new();
        }
        
        let end = std::cmp::min(start + actual_limit as usize, all_challenges.len());
        all_challenges[start..end].to_vec()
    })
}

/// Updates challenge status (restricted to authorized callers)
/// @param id Challenge identifier
/// @param new_status New status to set
/// @returns Success or error
#[update]
pub fn update_challenge_status(id: u64, new_status: ChallengeStatus) -> ApiResponse<()> {
    let caller = ic_cdk::caller();
    
    CHALLENGES.with(|challenges| {
        let mut challenges = challenges.borrow_mut();
        match challenges.get(&id) {
            Some(challenge) => {
                // Check authorization
                if caller != challenge.company && !is_admin(&caller) {
                    return ApiResponse::Err(ZeroLockError::Unauthorized(
                        "Not authorized to update this challenge".to_string()
                    ));
                }
                
                // Validate status transition
                if let Err(error) = validate_status_transition(&challenge.status, &new_status) {
                    return ApiResponse::Err(error);
                }
                
                let mut updated_challenge = challenge;
                updated_challenge.status = new_status.clone();
                updated_challenge.updated_at = current_time();
                
                challenges.insert(id, updated_challenge);
                
                ic_cdk::println!("Challenge status updated: ID={}, Status={:?}", id, new_status);
                ApiResponse::Ok(())
            }
            None => ApiResponse::Err(ZeroLockError::NotFound("Challenge not found".to_string())),
        }
    })
}

/// Deploys the target canister for a challenge
/// @param challenge_id Challenge identifier
/// @returns Principal of deployed canister or error
#[update]
pub async fn deploy_target_canister(challenge_id: u64) -> ApiResponse<Principal> {
    let caller = ic_cdk::caller();
    
    let challenge = CHALLENGES.with(|challenges| {
        challenges.borrow().get(&challenge_id)
    });
    
    let challenge = match challenge {
        Some(c) => c,
        None => return ApiResponse::Err(ZeroLockError::NotFound("Challenge not found".to_string())),
    };
    
    // Check authorization
    if caller != challenge.company && !is_admin(&caller) {
        return ApiResponse::Err(ZeroLockError::Unauthorized(
            "Not authorized to deploy canister for this challenge".to_string()
        ));
    }
    
    // Check challenge status
    if challenge.status != ChallengeStatus::Created {
        return ApiResponse::Err(ZeroLockError::InvalidState(
            "Challenge must be in Created status to deploy canister".to_string()
        ));
    }
    
    // Deploy canister using IC management canister
    match create_canister(
        CreateCanisterArgument {
            settings: Some(CanisterSettings {
                controllers: Some(vec![ic_cdk::id()]),
                compute_allocation: None,
                memory_allocation: None,
                freezing_threshold: None,
                reserved_cycles_limit: None,
            }),
        },
        1_000_000_000_000u128, // 1T cycles
    ).await {
        Ok((canister_result,)) => {
            let canister_id = canister_result.canister_id;
            
            // Install the WASM code
            match install_code(InstallCodeArgument {
                mode: CanisterInstallMode::Install,
                canister_id,
                wasm_module: challenge.wasm_code.clone(),
                arg: vec![], // Empty argument
            }).await {
                Ok(_) => {
                    // Update challenge with deployed canister
                    CHALLENGES.with(|challenges| {
                        let mut challenges = challenges.borrow_mut();
                        if let Some(mut updated_challenge) = challenges.get(&challenge_id) {
                            updated_challenge.target_canister = Some(canister_id);
                            updated_challenge.status = ChallengeStatus::Active;
                            updated_challenge.updated_at = current_time();
                            challenges.insert(challenge_id, updated_challenge);
                        }
                    });
                    
                    ic_cdk::println!(
                        "Target canister deployed: Challenge={}, Canister={}",
                        challenge_id,
                        canister_id.to_text()
                    );
                    ApiResponse::Ok(canister_id)
                }
                Err((code, msg)) => ApiResponse::Err(ZeroLockError::InternalError(
                    format!("Failed to install code: {:?} - {}", code, msg)
                )),
            }
        }
        Err((code, msg)) => ApiResponse::Err(ZeroLockError::InternalError(
            format!("Failed to create canister: {:?} - {}", code, msg)
        )),
    }
}

/// Manually expires a challenge
/// @param id Challenge identifier
/// @returns Success or error
#[update]
pub fn expire_challenge(id: u64) -> ApiResponse<()> {
    let caller = ic_cdk::caller();
    
    CHALLENGES.with(|challenges| {
        let mut challenges = challenges.borrow_mut();
        match challenges.get(&id) {
            Some(challenge) => {
                // Check authorization
                if caller != challenge.company && !is_admin(&caller) {
                    return ApiResponse::Err(ZeroLockError::Unauthorized(
                        "Not authorized to expire this challenge".to_string()
                    ));
                }
                
                // Check if challenge can be expired
                if is_final_status(&challenge.status) {
                    return ApiResponse::Err(ZeroLockError::InvalidState(
                        "Challenge is already in final state".to_string()
                    ));
                }
                
                let mut updated_challenge = challenge;
                updated_challenge.status = ChallengeStatus::Expired;
                updated_challenge.updated_at = current_time();
                
                challenges.insert(id, updated_challenge);
                
                ic_cdk::println!("Challenge expired: ID={}", id);
                ApiResponse::Ok(())
            }
            None => ApiResponse::Err(ZeroLockError::NotFound("Challenge not found".to_string())),
        }
    })
}

/// Gets challenge statistics
/// @returns Statistics object with counts by status
#[query]
pub fn get_challenge_stats() -> ChallengeStats {
    CHALLENGES.with(|challenges| {
        let mut stats = ChallengeStats::default();
        
        for (_, challenge) in challenges.borrow().iter() {
            stats.total += 1;
            match challenge.status {
                ChallengeStatus::Active => stats.active += 1,
                ChallengeStatus::Completed => stats.completed += 1,
                ChallengeStatus::Expired => stats.expired += 1,
                ChallengeStatus::Cancelled => stats.cancelled += 1,
                ChallengeStatus::Created => {}, // Count as neither active nor completed
            }
        }
        
        stats
    })
}

/// Gets challenges created by a specific company
/// @param company Principal of the company
/// @returns Array of challenges
#[query]
pub fn get_company_challenges(company: Principal) -> Vec<Challenge> {
    CHALLENGES.with(|challenges| {
        let mut company_challenges: Vec<Challenge> = challenges
            .borrow()
            .iter()
            .filter_map(|(_, challenge)| {
                if challenge.company == company {
                    Some(challenge)
                } else {
                    None
                }
            })
            .collect();
        
        // Sort by creation time (newest first)
        company_challenges.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        company_challenges
    })
}

/// Adds an admin (only callable by existing admins or during initialization)
#[update]
pub fn add_admin(new_admin: Principal) -> ApiResponse<()> {
    let caller = ic_cdk::caller();
    
    let admin_count = ADMINS.with(|admins| admins.borrow().len());
    
    if admin_count > 0 && !is_admin(&caller) {
        return ApiResponse::Err(ZeroLockError::Unauthorized(
            "Only admins can add new admins".to_string()
        ));
    }
    
    if is_admin(&new_admin) {
        return ApiResponse::Err(ZeroLockError::InvalidInput(
            "Principal is already an admin".to_string()
        ));
    }
    
    let admin_id = NEXT_ADMIN_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    });
    
    ADMINS.with(|admins| {
        admins.borrow_mut().insert(admin_id, new_admin)
    });
    
    ic_cdk::println!("Admin added: {}", new_admin.to_text());
    ApiResponse::Ok(())
}

/// Gets the list of admin principals
#[query]
pub fn get_admins() -> Vec<Principal> {
    ADMINS.with(|admins| {
        admins.borrow().iter().map(|(_, principal)| principal).collect()
    })
}

// Private helper functions

/// Validates challenge creation request
fn validate_challenge_request(request: &CreateChallengeRequest) -> Result<(), ZeroLockError> {
    // Validate WASM size
    if request.wasm_code.len() > MAX_WASM_SIZE {
        return Err(ZeroLockError::InvalidInput(
            "WASM code exceeds maximum size limit".to_string()
        ));
    }
    
    if request.wasm_code.is_empty() {
        return Err(ZeroLockError::InvalidInput(
            "WASM code cannot be empty".to_string()
        ));
    }
    
    // Validate bounty amount
    if request.bounty_amount < MIN_BOUNTY_AMOUNT {
        return Err(ZeroLockError::InvalidInput(
            "Bounty amount below minimum threshold".to_string()
        ));
    }
    
    // Validate duration
    if request.duration_hours < MIN_DURATION_HOURS || request.duration_hours > MAX_DURATION_HOURS {
        return Err(ZeroLockError::InvalidInput(
            format!(
                "Duration must be between {} and {} hours",
                MIN_DURATION_HOURS, MAX_DURATION_HOURS
            )
        ));
    }
    
    // Validate description
    if request.description.len() > MAX_DESCRIPTION_LENGTH {
        return Err(ZeroLockError::InvalidInput(
            "Description exceeds maximum length".to_string()
        ));
    }
    
    // Validate difficulty level
    if !is_valid_difficulty_level(request.difficulty_level) {
        return Err(ZeroLockError::InvalidInput(
            "Difficulty level must be between 1 and 5".to_string()
        ));
    }
    
    // Validate Candid interface is not empty
    if request.candid_interface.is_empty() {
        return Err(ZeroLockError::InvalidInput(
            "Candid interface cannot be empty".to_string()
        ));
    }
    
    Ok(())
}

/// Validates status transitions
fn validate_status_transition(
    current_status: &ChallengeStatus,
    new_status: &ChallengeStatus,
) -> Result<(), ZeroLockError> {
    if can_transition_to(current_status, new_status) {
        Ok(())
    } else {
        Err(ZeroLockError::InvalidState(
            "Invalid status transition".to_string()
        ))
    }
}

/// Counts challenges created by a user
fn count_user_challenges(user: &Principal) -> u64 {
    CHALLENGES.with(|challenges| {
        challenges
            .borrow()
            .iter()
            .filter(|(_, challenge)| challenge.company == *user)
            .count() as u64
    })
}

/// Checks if a principal is an admin
fn is_admin(principal: &Principal) -> bool {
    ADMINS.with(|admins| {
        admins
            .borrow()
            .iter()
            .any(|(_, admin)| admin == *principal)
    })
}

/// Periodic task to check and expire challenges (called by heartbeat)
#[heartbeat]
pub async fn check_expired_challenges() {
    let current_time = current_time();
    
    CHALLENGES.with(|challenges| {
        let mut challenges = challenges.borrow_mut();
        let expired_challenges: Vec<u64> = challenges
            .iter()
            .filter_map(|(id, challenge)| {
                if challenge.status == ChallengeStatus::Active && current_time > challenge.end_time {
                    Some(id)
                } else {
                    None
                }
            })
            .collect();
        
        for id in expired_challenges {
            if let Some(mut challenge) = challenges.get(&id) {
                challenge.status = ChallengeStatus::Expired;
                challenge.updated_at = current_time;
                challenges.insert(id, challenge);
                ic_cdk::println!("Auto-expired challenge: ID={}", id);
            }
        }
    });
}