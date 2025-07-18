//! ZeroLock Platform - Rust Implementation
//! A decentralized bug bounty platform on Internet Computer Protocol (ICP)

use ic_cdk_macros::*;

pub mod types;
pub mod bounty_factory;
pub mod vault;
pub mod judge;
pub mod leaderboard;

// Re-export commonly used types
pub use types::*;

// Initialize the canister
#[init]
fn init() {
    ic_cdk::println!("ZeroLock Platform initialized");
}

// Pre-upgrade hook
#[pre_upgrade]
fn pre_upgrade() {
    ic_cdk::println!("Preparing for upgrade...");
}

// Post-upgrade hook
#[post_upgrade]
fn post_upgrade() {
    ic_cdk::println!("Upgrade completed");
}