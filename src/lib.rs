//! ZeroLock Platform - Unified Canister Implementation
//! A decentralized bug bounty platform on Internet Computer Protocol (ICP)
//! All modules integrated into a single canister for simplified deployment

use ic_cdk_macros::*;
use candid::Principal;

// Import all modules
pub mod types;
pub mod bounty_factory;
pub mod vault;
pub mod judge;
pub mod leaderboard;

// Re-export commonly used types
pub use types::*;

// Re-export all public functions from modules
pub use bounty_factory::*;
pub use vault::*;
pub use judge::*;
pub use leaderboard::*;

// Initialize the unified canister
#[init]
fn init() {
    ic_cdk::println!("ZeroLock Unified Platform initialized");
    
    // Initialize cross-module references
    let canister_id = ic_cdk::id();
    
    // Set up internal canister references for authorization
    judge::set_bounty_factory_canister(canister_id);
    judge::set_vault_canister_internal(canister_id);
    vault::add_authorized_canister(canister_id);
    leaderboard::set_bounty_factory_canister(canister_id);
    
    ic_cdk::println!("Cross-module references configured");
}

// Pre-upgrade hook
#[pre_upgrade]
fn pre_upgrade() {
    ic_cdk::println!("Preparing unified canister for upgrade...");
}

// Post-upgrade hook
#[post_upgrade]
fn post_upgrade() {
    ic_cdk::println!("Unified canister upgrade completed");
    
    // Re-initialize cross-module references after upgrade
    let canister_id = ic_cdk::id();
    judge::set_bounty_factory_canister(canister_id);
    judge::set_vault_canister_internal(canister_id);
    vault::add_authorized_canister(canister_id);
    leaderboard::set_bounty_factory_canister(canister_id);
}