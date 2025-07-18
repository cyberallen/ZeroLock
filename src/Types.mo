/**
 * Shared types and interfaces for ZeroLock platform
 * Contains common data structures used across all canisters
 */

module {
    
    // Token types supported by the platform
    public type TokenType = {
        #ICP;
        #ICRC1: Principal;
    };
    
    // Challenge lifecycle states
    public type ChallengeStatus = {
        #Created;     // Challenge created but not yet active
        #Active;      // Challenge is live and accepting attacks
        #Completed;   // Challenge successfully completed by a hacker
        #Expired;     // Challenge time limit exceeded
        #Cancelled;   // Challenge cancelled by company or admin
    };
    
    // Core challenge data structure
    public type Challenge = {
        id: Nat;
        company: Principal;
        target_canister: ?Principal;
        wasm_code: Blob;
        candid_interface: Text;
        bounty_amount: Nat;
        token_type: TokenType;
        start_time: Int;
        end_time: Int;
        status: ChallengeStatus;
        description: Text;
        difficulty_level: Nat; // 1-5 scale
        created_at: Int;
        updated_at: Int;
    };
    
    // Attack attempt record
    public type AttackAttempt = {
        id: Nat;
        challenge_id: Nat;
        hacker: Principal;
        timestamp: Int;
        success: Bool;
        proof: ?Blob; // Optional proof of successful attack
        gas_used: Nat;
    };
    
    // Vault transaction types
    public type TransactionType = {
        #Lock;        // Lock funds for a challenge
        #Unlock;      // Unlock funds (challenge cancelled/expired)
        #Payout;      // Pay bounty to successful hacker
        #Refund;      // Refund to company
        #Fee;         // Platform fee collection
    };
    
    // Vault transaction record
    public type Transaction = {
        id: Nat;
        transaction_type: TransactionType;
        challenge_id: Nat;
        from: Principal;
        to: Principal;
        amount: Nat;
        token_type: TokenType;
        timestamp: Int;
        status: TransactionStatus;
    };
    
    public type TransactionStatus = {
        #Pending;
        #Completed;
        #Failed;
        #Cancelled;
    };
    
    // Judge decision types
    public type JudgeDecision = {
        #Valid;       // Attack is valid, pay bounty
        #Invalid;     // Attack is invalid, no payout
        #Disputed;    // Requires manual review
        #Pending;     // Still under evaluation
    };
    
    // Judge evaluation record
    public type Evaluation = {
        id: Nat;
        challenge_id: Nat;
        attack_attempt_id: Nat;
        decision: JudgeDecision;
        reasoning: Text;
        timestamp: Int;
        evaluator: Principal; // Could be automated system or human judge
    };
    
    // Platform statistics
    public type PlatformStats = {
        total_challenges: Nat;
        active_challenges: Nat;
        completed_challenges: Nat;
        total_bounty_paid: Nat;
        total_hackers: Nat;
        total_companies: Nat;
    };
    
    // User profile types
    public type UserRole = {
        #Company;
        #Hacker;
        #Admin;
    };
    
    public type UserProfile = {
        principal: Principal;
        role: UserRole;
        reputation_score: Nat;
        total_bounties_earned: Nat;
        total_bounties_offered: Nat;
        successful_attacks: Nat;
        created_challenges: Nat;
        joined_at: Int;
        last_active: Int;
    };
    
    // Error types used across the platform
    public type Error = {
        #NotFound: Text;
        #Unauthorized: Text;
        #InvalidInput: Text;
        #InternalError: Text;
        #ResourceLimit: Text;
        #InvalidState: Text;
        #InsufficientFunds: Text;
        #NetworkError: Text;
    };
    
    // Event types for cross-canister communication
    public type Event = {
        #ChallengeCreated: { challenge_id: Nat; company: Principal };
        #ChallengeActivated: { challenge_id: Nat };
        #AttackAttempted: { challenge_id: Nat; hacker: Principal };
        #AttackSuccessful: { challenge_id: Nat; hacker: Principal };
        #ChallengeCompleted: { challenge_id: Nat; winner: Principal };
        #ChallengeExpired: { challenge_id: Nat };
        #FundsLocked: { challenge_id: Nat; amount: Nat };
        #BountyPaid: { challenge_id: Nat; recipient: Principal; amount: Nat };
    };
    
    // Configuration types
    public type PlatformConfig = {
        min_bounty_amount: Nat;
        max_challenge_duration: Nat;
        platform_fee_percentage: Nat; // Basis points (e.g., 250 = 2.5%)
        max_challenges_per_user: Nat;
        reputation_threshold_for_high_value: Nat;
    };
    
    // Pagination helper
    public type PaginationParams = {
        offset: Nat;
        limit: Nat;
    };
    
    public type PaginatedResult<T> = {
        data: [T];
        total: Nat;
        offset: Nat;
        limit: Nat;
        has_more: Bool;
    };
    
    // Filter types for queries
    public type ChallengeFilter = {
        status: ?ChallengeStatus;
        company: ?Principal;
        difficulty_level: ?Nat;
        token_type: ?TokenType;
        min_bounty: ?Nat;
        max_bounty: ?Nat;
    };
    
    // Sorting options
    public type SortOrder = {
        #Asc;
        #Desc;
    };
    
    public type ChallengeSortBy = {
        #CreatedAt;
        #BountyAmount;
        #EndTime;
        #DifficultyLevel;
    };
    
    // API response wrapper
    public type ApiResponse<T> = {
        #Ok: T;
        #Err: Error;
    };
    
    // Utility functions
    public func isValidDifficultyLevel(level: Nat) : Bool {
        level >= 1 and level <= 5
    };
    
    public func isValidTokenType(token: TokenType) : Bool {
        switch (token) {
            case (#ICP) { true };
            case (#ICRC1(_)) { true };
        }
    };
    
    public func isFinalStatus(status: ChallengeStatus) : Bool {
        switch (status) {
            case (#Completed or #Expired or #Cancelled) { true };
            case (#Created or #Active) { false };
        }
    };
    
    public func canTransitionTo(from: ChallengeStatus, to: ChallengeStatus) : Bool {
        switch (from, to) {
            case (#Created, #Active) { true };
            case (#Created, #Cancelled) { true };
            case (#Active, #Completed) { true };
            case (#Active, #Expired) { true };
            case (#Active, #Cancelled) { true };
            case (_, _) { from == to }; // Allow setting same status
        }
    };
}