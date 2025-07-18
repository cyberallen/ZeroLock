use ic_cdk::api::time;
use ic_cdk::{caller, query, update};
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, Storable, BoundedStorable};
use std::cell::RefCell;
use std::borrow::Cow;

use crate::types::*;

// Wrapper types for stable storage
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct StorableString(pub String);

impl Storable for StorableString {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(&self.0).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        StorableString(candid::decode_one(&bytes).unwrap())
    }
}

impl BoundedStorable for StorableString {
    const MAX_SIZE: u32 = 256;
    const IS_FIXED_SIZE: bool = false;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct StorableVecU64(pub Vec<u64>);

impl Storable for StorableVecU64 {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(&self.0).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        StorableVecU64(candid::decode_one(&bytes).unwrap())
    }
}

impl BoundedStorable for StorableVecU64 {
    const MAX_SIZE: u32 = 1024;
    const IS_FIXED_SIZE: bool = false;
}

// Memory management
type Memory = VirtualMemory<DefaultMemoryImpl>;
type UserProfilesMap = StableBTreeMap<Principal, UserProfile, Memory>;
type DisplayNamesMap = StableBTreeMap<Principal, StorableString, Memory>;
type AchievementsMap = StableBTreeMap<u64, Achievement, Memory>;
type ChallengeHistoryMap = StableBTreeMap<Principal, StorableVecU64, Memory>;

// Additional types for Leaderboard
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LeaderboardEntry {
    pub rank: u64,
    pub principal: Principal,
    pub display_name: Option<String>,
    pub reputation: u64,
    pub challenges_completed: u64,
    pub total_earned: u64,
    pub created_at: i64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CompanyLeaderboardEntry {
    pub rank: u64,
    pub principal: Principal,
    pub display_name: Option<String>,
    pub reputation: u64,
    pub challenges_completed: u64,
    pub total_earned: u64,
    pub created_at: i64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum AchievementType {
    FirstBlood,
    TopEarner,
    SerialHacker,
    QuickSolver,
    GenerousCompany,
    ActiveContributor,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Achievement {
    pub id: u64,
    pub achievement_type: AchievementType,
    pub recipient: Principal,
    pub timestamp: i64,
    pub description: String,
    pub challenge_id: Option<u64>,
}

impl Storable for Achievement {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for Achievement {
    const MAX_SIZE: u32 = 512;
    const IS_FIXED_SIZE: bool = false;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UserStats {
    pub total_users: u64,
    pub active_hackers: u64,
    pub active_companies: u64,
    pub new_users_last_week: u64,
}

// State variables
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );
    
    static USER_PROFILES: RefCell<UserProfilesMap> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(20)))
        )
    );
    
    static DISPLAY_NAMES: RefCell<DisplayNamesMap> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(21)))
        )
    );
    
    static ACHIEVEMENTS: RefCell<AchievementsMap> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(22)))
        )
    );
    
    static CHALLENGE_HISTORY: RefCell<ChallengeHistoryMap> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(23)))
        )
    );
    
    static PLATFORM_STATS: RefCell<PlatformStats> = RefCell::new(PlatformStats::default());
    static NEXT_ACHIEVEMENT_ID: RefCell<u64> = RefCell::new(1);
    static BOUNTY_FACTORY_CANISTER: RefCell<Option<Principal>> = RefCell::new(None);
}

// Public functions

/**
 * Registers a new user
 */
#[update]
pub fn register_user(role: UserRole) -> Result<(), ZeroLockError> {
    let caller = caller();
    
    // Check if user already exists
    if USER_PROFILES.with(|profiles| profiles.borrow().contains_key(&caller)) {
        return Err(ZeroLockError::AlreadyExists("User already registered".to_string()));
    }
    
    let current_time = time() as i64;
    let profile = UserProfile {
        principal: caller,
        username: String::new(), // Will be set via set_display_name
        reputation: 0,
        total_earned: 0,
        challenges_completed: 0,
        role: role.clone(),
        created_at: current_time as u64,
    };
    
    USER_PROFILES.with(|profiles| {
        profiles.borrow_mut().insert(caller, profile);
    });
    
    ic_cdk::println!("User registered: {:?} as {:?}", caller, role);
    Ok(())
}

/**
 * Sets display name for a user
 */
#[update]
pub fn set_display_name(name: String) -> Result<(), ZeroLockError> {
    let caller = caller();
    
    // Validate name length
    if name.len() > 50 {
        return Err(ZeroLockError::InvalidInput("Display name too long".to_string()));
    }
    
    if name.trim().is_empty() {
        return Err(ZeroLockError::InvalidInput("Display name cannot be empty".to_string()));
    }
    
    // Check if user exists
    if !USER_PROFILES.with(|profiles| profiles.borrow().contains_key(&caller)) {
        return Err(ZeroLockError::NotFound("User not registered".to_string()));
    }
    
    DISPLAY_NAMES.with(|names| {
        names.borrow_mut().insert(caller, StorableString(name.clone()));
    });
    
    ic_cdk::println!("Display name set: {} for {:?}", name, caller);
    Ok(())
}

/**
 * Records a successful attack (called by BountyFactory)
 */
#[update]
pub fn record_successful_attack(
    attacker: Principal,
    challenge_id: u64,
    bounty_amount: u64,
) -> Result<(), ZeroLockError> {
    // Verify caller is BountyFactory
    let caller = caller();
    let bounty_factory = BOUNTY_FACTORY_CANISTER.with(|bf| bf.borrow().clone());
    
    match bounty_factory {
        Some(bf) if bf == caller => {},
        _ => return Err(ZeroLockError::Unauthorized("Only BountyFactory can call this function".to_string())),
    }
    
    // Update attacker profile
    USER_PROFILES.with(|profiles| {
        let mut profiles_map = profiles.borrow_mut();
        if let Some(mut profile) = profiles_map.get(&attacker) {
            profile.challenges_completed += 1;
            profile.total_earned += bounty_amount;
            profile.reputation += calculate_reputation_gain(bounty_amount);
            // Note: last_active field doesn't exist in UserProfile, using created_at instead
            profiles_map.insert(attacker, profile);
        }
    });
    
    // Update challenge history
    CHALLENGE_HISTORY.with(|history| {
        let mut history_map = history.borrow_mut();
        let mut user_challenges = history_map.get(&attacker).map(|v| v.0).unwrap_or_default();
        user_challenges.push(challenge_id);
        history_map.insert(attacker, StorableVecU64(user_challenges));
    });
    
    // Grant achievements
    let challenges_completed = USER_PROFILES.with(|profiles| {
        profiles.borrow().get(&attacker).map(|p| p.challenges_completed).unwrap_or(0)
    });
    
    if challenges_completed == 1 {
        grant_achievement(attacker, AchievementType::FirstBlood, Some(challenge_id));
    } else if challenges_completed == 5 {
        grant_achievement(attacker, AchievementType::SerialHacker, Some(challenge_id));
    }
    
    if bounty_amount >= 1000 { // High-value bounty threshold
        grant_achievement(attacker, AchievementType::TopEarner, Some(challenge_id));
    }
    
    // Update platform stats
        PLATFORM_STATS.with(|stats| {
            let mut platform_stats = stats.borrow_mut();
            platform_stats.total_bounties_paid += bounty_amount;
            platform_stats.successful_attacks += 1;
        });
    
    ic_cdk::println!("Successful attack recorded: Attacker={:?}, Challenge={}, Bounty={}", 
                    attacker, challenge_id, bounty_amount);
    Ok(())
}

/**
 * Records challenge creation (called by BountyFactory)
 */
#[update]
pub fn record_challenge_creation(
    company: Principal,
    challenge_id: u64,
    bounty_amount: u64,
) -> Result<(), ZeroLockError> {
    // Verify caller is BountyFactory
    let caller = caller();
    let bounty_factory = BOUNTY_FACTORY_CANISTER.with(|bf| bf.borrow().clone());
    
    match bounty_factory {
        Some(bf) if bf == caller => {},
        _ => return Err(ZeroLockError::Unauthorized("Only BountyFactory can call this function".to_string())),
    }
    
    // Update company profile
    USER_PROFILES.with(|profiles| {
        let mut profiles_map = profiles.borrow_mut();
        if let Some(mut profile) = profiles_map.get(&company) {
            profile.challenges_completed += 1;
            profile.total_earned += bounty_amount;
            profile.reputation += 10; // Base reputation for creating challenge
            profiles_map.insert(company, profile);
        }
    });
    
    // Grant achievements
    let created_challenges = USER_PROFILES.with(|profiles| {
        profiles.borrow().get(&company).map(|p| p.challenges_completed).unwrap_or(0)
    });
    
    if created_challenges == 5 {
        grant_achievement(company, AchievementType::ActiveContributor, Some(challenge_id));
    }
    
    if bounty_amount >= 5000 { // High-value bounty threshold
        grant_achievement(company, AchievementType::GenerousCompany, Some(challenge_id));
    }
    
    // Update platform stats
    PLATFORM_STATS.with(|stats| {
        let mut platform_stats = stats.borrow_mut();
        platform_stats.total_challenges += 1;
        platform_stats.active_challenges += 1;
    });
    
    ic_cdk::println!("Challenge created: ID={}, Company={:?}", challenge_id, company);
    Ok(())
}

/**
 * Gets the hacker leaderboard
 */
#[query]
pub fn get_hacker_leaderboard(limit: u64) -> Vec<LeaderboardEntry> {
    let max_limit = 100;
    let actual_limit = if limit > max_limit { max_limit } else { limit };
    
    let mut hackers: Vec<(Principal, UserProfile)> = USER_PROFILES.with(|profiles| {
        profiles.borrow().iter()
            .filter(|(_, profile)| matches!(profile.role, UserRole::Hacker))
            .collect()
    });
    
    // Sort by reputation score (descending)
    hackers.sort_by(|a, b| b.1.reputation.cmp(&a.1.reputation));
    
    let result_size = std::cmp::min(actual_limit as usize, hackers.len());
    hackers.into_iter()
        .take(result_size)
        .enumerate()
        .map(|(i, (principal, profile))| {
            let display_name = DISPLAY_NAMES.with(|names| {
                names.borrow().get(&principal).map(|s| s.0)
            });
            
            LeaderboardEntry {
                rank: (i + 1) as u64,
                principal,
                display_name,
                reputation: profile.reputation,
                challenges_completed: profile.challenges_completed,
                total_earned: profile.total_earned,
                created_at: profile.created_at as i64,
            }
        })
        .collect()
}

/**
 * Gets the company leaderboard
 */
#[query]
pub fn get_company_leaderboard(limit: u64) -> Vec<CompanyLeaderboardEntry> {
    let max_limit = 100;
    let actual_limit = if limit > max_limit { max_limit } else { limit };
    
    let mut companies: Vec<(Principal, UserProfile)> = USER_PROFILES.with(|profiles| {
        profiles.borrow().iter()
            .filter(|(_, profile)| matches!(profile.role, UserRole::Company))
            .collect()
    });
    
    // Sort by reputation score (descending)
    companies.sort_by(|a, b| b.1.reputation.cmp(&a.1.reputation));
    
    let result_size = std::cmp::min(actual_limit as usize, companies.len());
    companies.into_iter()
        .take(result_size)
        .enumerate()
        .map(|(i, (principal, profile))| {
            let display_name = DISPLAY_NAMES.with(|names| {
                names.borrow().get(&principal).map(|s| s.0)
            });
            
            CompanyLeaderboardEntry {
                rank: (i + 1) as u64,
                principal,
                display_name,
                reputation: profile.reputation,
                challenges_completed: profile.challenges_completed,
                total_earned: profile.total_earned,
                created_at: profile.created_at as i64,
            }
        })
        .collect()
}

/**
 * Gets a user profile
 */
#[query]
pub fn get_user_profile(user: Principal) -> Result<(UserProfile, Option<String>, Vec<Achievement>, Vec<u64>), ZeroLockError> {
    let profile = USER_PROFILES.with(|profiles| {
        profiles.borrow().get(&user)
    }).ok_or_else(|| ZeroLockError::NotFound("User profile not found".to_string()))?;
    
    let display_name = DISPLAY_NAMES.with(|names| {
        names.borrow().get(&user).map(|s| s.0)
    });
    
    let user_achievements: Vec<Achievement> = ACHIEVEMENTS.with(|achievements| {
        achievements.borrow().iter()
            .filter(|(_, achievement)| achievement.recipient == user)
            .map(|(_, achievement)| achievement)
            .collect()
    });
    
    let user_challenges = CHALLENGE_HISTORY.with(|history| {
        history.borrow().get(&user).map(|v| v.0).unwrap_or_default()
    });
    
    Ok((profile, display_name, user_achievements, user_challenges))
}

/**
 * Gets platform statistics
 */
#[query]
pub fn get_platform_stats() -> PlatformStats {
    PLATFORM_STATS.with(|stats| stats.borrow().clone())
}

/**
 * Gets user statistics
 */
#[query]
pub fn get_user_stats() -> UserStats {
    let current_time = time() as i64;
    let one_week_ago = current_time - (7 * 24 * 3600 * 1_000_000_000); // 7 days in nanoseconds
    let thirty_days_ago = current_time - (30 * 24 * 3600 * 1_000_000_000); // 30 days in nanoseconds
    
    let (total_users, active_hackers, active_companies, new_users) = USER_PROFILES.with(|profiles| {
        let profiles_map = profiles.borrow();
        let total = profiles_map.len() as u64;
        
        let mut active_hackers = 0;
        let mut active_companies = 0;
        let mut new_users = 0;
        
        for (_, profile) in profiles_map.iter() {
            if profile.created_at > thirty_days_ago as u64 {
                match profile.role {
                    UserRole::Hacker => active_hackers += 1,
                    UserRole::Company => active_companies += 1,
                    _ => {},
                }
            }
            
            if profile.created_at > one_week_ago as u64 {
                new_users += 1;
            }
        }
        
        (total, active_hackers, active_companies, new_users)
    });
    
    UserStats {
        total_users,
        active_hackers,
        active_companies,
        new_users_last_week: new_users,
    }
}

// Private helper functions

/**
 * Grants an achievement to a user
 */
fn grant_achievement(recipient: Principal, achievement_type: AchievementType, challenge_id: Option<u64>) {
    let achievement_id = NEXT_ACHIEVEMENT_ID.with(|id| {
        let current_id = *id.borrow();
        *id.borrow_mut() = current_id + 1;
        current_id
    });
    
    let description = match achievement_type {
        AchievementType::FirstBlood => "Completed first successful attack".to_string(),
        AchievementType::TopEarner => "Earned significant bounties".to_string(),
        AchievementType::SerialHacker => "Completed 5 successful attacks".to_string(),
        AchievementType::QuickSolver => "Solved a challenge in record time".to_string(),
        AchievementType::GenerousCompany => "Offered a high-value bounty".to_string(),
        AchievementType::ActiveContributor => "Created 5 challenges".to_string(),
    };
    
    let achievement = Achievement {
        id: achievement_id,
        achievement_type,
        recipient,
        timestamp: time() as i64,
        description: description.clone(),
        challenge_id,
    };
    
    ACHIEVEMENTS.with(|achievements| {
        achievements.borrow_mut().insert(achievement_id, achievement);
    });
    
    ic_cdk::println!("Achievement granted: {} to {:?}", description, recipient);
}

/**
 * Calculates reputation gain based on bounty amount
 */
fn calculate_reputation_gain(bounty_amount: u64) -> u64 {
    // Base reputation + bonus based on bounty size
    let base_reputation = 50;
    let bonus = bounty_amount / 100; // 1 reputation per 100 tokens
    base_reputation + bonus
}

// Configuration functions

/**
 * Sets the BountyFactory canister reference
 */
#[update]
pub fn set_bounty_factory(canister: Principal) -> Result<(), ZeroLockError> {
    // In production, this should be restricted to governance
    BOUNTY_FACTORY_CANISTER.with(|bf| {
        *bf.borrow_mut() = Some(canister);
    });
    
    ic_cdk::println!("BountyFactory canister set: {:?}", canister);
    Ok(())
}