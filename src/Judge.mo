import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Option "mo:base/Option";
import Timer "mo:base/Timer";
import Types "./Types";

/**
 * Judge Canister - Automated evaluation and settlement engine for ZeroLock platform
 * Monitors challenge states, validates attacks, and triggers automatic settlements
 */
actor Judge {
    
    // Import types from shared module
    type Challenge = Types.Challenge;
    type ChallengeStatus = Types.ChallengeStatus;
    type AttackAttempt = Types.AttackAttempt;
    type JudgeDecision = Types.JudgeDecision;
    type Evaluation = Types.Evaluation;
    type Error = Types.Error;
    type TokenType = Types.TokenType;
    
    // Judge-specific types
    public type MonitoringState = {
        challenge_id: Nat;
        target_canister: Principal;
        initial_balance: Nat;
        current_balance: Nat;
        last_check: Int;
        monitoring_active: Bool;
        attack_detected: Bool;
    };
    
    public type BalanceSnapshot = {
        canister_id: Principal;
        balance: Nat;
        timestamp: Int;
        block_height: ?Nat;
    };
    
    public type AutomatedRule = {
        id: Nat;
        name: Text;
        condition: RuleCondition;
        action: RuleAction;
        enabled: Bool;
        priority: Nat;
    };
    
    public type RuleCondition = {
        #BalanceDecrease: { threshold_percentage: Nat };
        #TimeExpired;
        #ManualTrigger;
        #ConsensusReached: { required_votes: Nat };
    };
    
    public type RuleAction = {
        #PayBounty: Principal;
        #RefundCompany;
        #RequireManualReview;
        #ExtendDeadline: Int;
    };
    
    public type DisputeCase = {
        id: Nat;
        challenge_id: Nat;
        attack_attempt_id: Nat;
        disputer: Principal;
        reason: Text;
        evidence: [Blob];
        status: DisputeStatus;
        created_at: Int;
        resolved_at: ?Int;
        resolution: ?Text;
    };
    
    public type DisputeStatus = {
        #Open;
        #UnderReview;
        #Resolved;
        #Rejected;
    };
    
    // State variables
    private stable var nextEvaluationId: Nat = 1;
    private stable var nextDisputeId: Nat = 1;
    private stable var nextRuleId: Nat = 1;
    
    private stable var evaluationEntries: [(Nat, Evaluation)] = [];
    private stable var monitoringEntries: [(Nat, MonitoringState)] = [];
    private stable var disputeEntries: [(Nat, DisputeCase)] = [];
    private stable var ruleEntries: [(Nat, AutomatedRule)] = [];
    private stable var balanceHistoryEntries: [(Text, [BalanceSnapshot])] = [];
    
    private var evaluations = HashMap.HashMap<Nat, Evaluation>(10, Nat.equal, Nat.hash);
    private var monitoringStates = HashMap.HashMap<Nat, MonitoringState>(10, Nat.equal, Nat.hash);
    private var disputes = HashMap.HashMap<Nat, DisputeCase>(10, Nat.equal, Nat.hash);
    private var automatedRules = HashMap.HashMap<Nat, AutomatedRule>(10, Nat.equal, Nat.hash);
    private var balanceHistory = HashMap.HashMap<Text, [BalanceSnapshot]>(10, Text.equal, Text.hash);
    
    // External canister references
    private stable var bountyFactoryCanister: ?Principal = null;
    private stable var vaultCanister: ?Principal = null;
    
    // Configuration
    private let BALANCE_CHECK_INTERVAL: Int = 60 * 1_000_000_000; // 60 seconds in nanoseconds
    private let MAX_BALANCE_HISTORY: Nat = 1000;
    private let ATTACK_THRESHOLD_PERCENTAGE: Nat = 10; // 10% balance decrease
    private let DISPUTE_REVIEW_PERIOD: Int = 7 * 24 * 3600 * 1_000_000_000; // 7 days
    
    // System upgrade hooks
    system func preupgrade() {
        evaluationEntries := Iter.toArray(evaluations.entries());
        monitoringEntries := Iter.toArray(monitoringStates.entries());
        disputeEntries := Iter.toArray(disputes.entries());
        ruleEntries := Iter.toArray(automatedRules.entries());
        balanceHistoryEntries := Iter.toArray(balanceHistory.entries());
    };
    
    system func postupgrade() {
        evaluations := HashMap.fromIter<Nat, Evaluation>(
            evaluationEntries.vals(), evaluationEntries.size(), Nat.equal, Nat.hash
        );
        monitoringStates := HashMap.fromIter<Nat, MonitoringState>(
            monitoringEntries.vals(), monitoringEntries.size(), Nat.equal, Nat.hash
        );
        disputes := HashMap.fromIter<Nat, DisputeCase>(
            disputeEntries.vals(), disputeEntries.size(), Nat.equal, Nat.hash
        );
        automatedRules := HashMap.fromIter<Nat, AutomatedRule>(
            ruleEntries.vals(), ruleEntries.size(), Nat.equal, Nat.hash
        );
        balanceHistory := HashMap.fromIter<Text, [BalanceSnapshot]>(
            balanceHistoryEntries.vals(), balanceHistoryEntries.size(), Text.equal, Text.hash
        );
        
        evaluationEntries := [];
        monitoringEntries := [];
        disputeEntries := [];
        ruleEntries := [];
        balanceHistoryEntries := [];
    };
    
    // Heartbeat for continuous monitoring
    system func heartbeat() : async () {
        await performPeriodicChecks();
    };
    
    /**
     * Starts monitoring a challenge's target canister
     * @param challenge_id Challenge identifier
     * @param target_canister Principal of the target canister
     * @returns Success or error
     */
    public shared(msg) func start_monitoring(challenge_id: Nat, target_canister: Principal) : async Result.Result<(), Error> {
        let caller = msg.caller;
        
        // Verify caller is authorized (BountyFactory)
        switch (bountyFactoryCanister) {
            case (?factory) {
                if (caller != factory) {
                    return #err(#Unauthorized("Only BountyFactory can start monitoring"));
                };
            };
            case null {
                return #err(#InternalError("BountyFactory canister not configured"));
            };
        };
        
        // Check if already monitoring
        switch (monitoringStates.get(challenge_id)) {
            case (?existing) {
                if (existing.monitoring_active) {
                    return #err(#InvalidState("Already monitoring this challenge"));
                };
            };
            case null {};
        };
        
        // Get initial balance
        let initialBalance = await getCanisterBalance(target_canister);
        
        let monitoringState: MonitoringState = {
            challenge_id = challenge_id;
            target_canister = target_canister;
            initial_balance = initialBalance;
            current_balance = initialBalance;
            last_check = Time.now();
            monitoring_active = true;
            attack_detected = false;
        };
        
        monitoringStates.put(challenge_id, monitoringState);
        
        // Record initial balance snapshot
        await recordBalanceSnapshot(target_canister, initialBalance);
        
        Debug.print("Started monitoring challenge: " # Nat.toText(challenge_id) # ", Target: " # Principal.toText(target_canister));
        #ok()
    };
    
    /**
     * Stops monitoring a challenge
     * @param challenge_id Challenge identifier
     * @returns Success or error
     */
    public shared(msg) func stop_monitoring(challenge_id: Nat) : async Result.Result<(), Error> {
        let caller = msg.caller;
        
        // Verify caller is authorized
        switch (bountyFactoryCanister) {
            case (?factory) {
                if (caller != factory) {
                    return #err(#Unauthorized("Only BountyFactory can stop monitoring"));
                };
            };
            case null {
                return #err(#InternalError("BountyFactory canister not configured"));
            };
        };
        
        switch (monitoringStates.get(challenge_id)) {
            case (?state) {
                let updatedState = {
                    state with
                    monitoring_active = false;
                };
                monitoringStates.put(challenge_id, updatedState);
                
                Debug.print("Stopped monitoring challenge: " # Nat.toText(challenge_id));
                #ok()
            };
            case null {
                #err(#NotFound("No monitoring state found for this challenge"))
            };
        }
    };
    
    /**
     * Evaluates an attack attempt and makes a decision
     * @param challenge_id Challenge identifier
     * @param attack_attempt Attack attempt data
     * @returns Evaluation result
     */
    public shared(msg) func evaluate_attack(challenge_id: Nat, attack_attempt: AttackAttempt) : async Result.Result<Evaluation, Error> {
        let caller = msg.caller;
        
        // Get monitoring state
        switch (monitoringStates.get(challenge_id)) {
            case (?state) {
                if (not state.monitoring_active) {
                    return #err(#InvalidState("Monitoring is not active for this challenge"));
                };
                
                // Check current balance
                let currentBalance = await getCanisterBalance(state.target_canister);
                await recordBalanceSnapshot(state.target_canister, currentBalance);
                
                // Calculate balance change
                let balanceDecrease = if (state.initial_balance > currentBalance) {
                    state.initial_balance - currentBalance
                } else { 0 };
                
                let decreasePercentage = if (state.initial_balance > 0) {
                    (balanceDecrease * 100) / state.initial_balance
                } else { 0 };
                
                // Make decision based on balance change
                let decision = if (decreasePercentage >= ATTACK_THRESHOLD_PERCENTAGE) {
                    #Valid
                } else {
                    #Invalid
                };
                
                let reasoning = "Balance change: " # Nat.toText(decreasePercentage) # "% (" # 
                               Nat.toText(balanceDecrease) # " tokens). Threshold: " # 
                               Nat.toText(ATTACK_THRESHOLD_PERCENTAGE) # "%";
                
                // Create evaluation record
                let evaluationId = nextEvaluationId;
                nextEvaluationId += 1;
                
                let evaluation: Evaluation = {
                    id = evaluationId;
                    challenge_id = challenge_id;
                    attack_attempt_id = attack_attempt.id;
                    decision = decision;
                    reasoning = reasoning;
                    timestamp = Time.now();
                    evaluator = Principal.fromActor(Judge);
                };
                
                evaluations.put(evaluationId, evaluation);
                
                // Update monitoring state
                let updatedState = {
                    state with
                    current_balance = currentBalance;
                    last_check = Time.now();
                    attack_detected = (decision == #Valid);
                };
                monitoringStates.put(challenge_id, updatedState);
                
                // Trigger settlement if attack is valid
                if (decision == #Valid) {
                    ignore await triggerSettlement(challenge_id, attack_attempt.hacker);
                };
                
                Debug.print("Attack evaluated: Challenge=" # Nat.toText(challenge_id) # ", Decision=" # debug_show(decision));
                #ok(evaluation)
            };
            case null {
                #err(#NotFound("No monitoring state found for this challenge"))
            };
        }
    };
    
    /**
     * Creates a dispute for an evaluation
     * @param challenge_id Challenge identifier
     * @param attack_attempt_id Attack attempt identifier
     * @param reason Dispute reason
     * @param evidence Supporting evidence
     * @returns Dispute ID on success
     */
    public shared(msg) func create_dispute(challenge_id: Nat, attack_attempt_id: Nat, reason: Text, evidence: [Blob]) : async Result.Result<Nat, Error> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err(#Unauthorized("Anonymous principals cannot create disputes"));
        };
        
        if (Text.size(reason) == 0) {
            return #err(#InvalidInput("Dispute reason cannot be empty"));
        };
        
        let disputeId = nextDisputeId;
        nextDisputeId += 1;
        
        let dispute: DisputeCase = {
            id = disputeId;
            challenge_id = challenge_id;
            attack_attempt_id = attack_attempt_id;
            disputer = caller;
            reason = reason;
            evidence = evidence;
            status = #Open;
            created_at = Time.now();
            resolved_at = null;
            resolution = null;
        };
        
        disputes.put(disputeId, dispute);
        
        Debug.print("Dispute created: ID=" # Nat.toText(disputeId) # ", Challenge=" # Nat.toText(challenge_id));
        #ok(disputeId)
    };
    
    /**
     * Resolves a dispute (admin function)
     * @param dispute_id Dispute identifier
     * @param resolution Resolution decision
     * @param resolution_text Explanation of resolution
     * @returns Success or error
     */
    public shared(msg) func resolve_dispute(dispute_id: Nat, resolution: DisputeStatus, resolution_text: Text) : async Result.Result<(), Error> {
        let caller = msg.caller;
        
        // In production, this should be restricted to authorized judges/admins
        
        switch (disputes.get(dispute_id)) {
            case (?dispute) {
                if (dispute.status != #Open and dispute.status != #UnderReview) {
                    return #err(#InvalidState("Dispute is already resolved"));
                };
                
                let updatedDispute = {
                    dispute with
                    status = resolution;
                    resolved_at = ?Time.now();
                    resolution = ?resolution_text;
                };
                
                disputes.put(dispute_id, updatedDispute);
                
                Debug.print("Dispute resolved: ID=" # Nat.toText(dispute_id) # ", Resolution=" # debug_show(resolution));
                #ok()
            };
            case null {
                #err(#NotFound("Dispute not found"))
            };
        }
    };
    
    /**
     * Gets monitoring state for a challenge
     * @param challenge_id Challenge identifier
     * @returns Monitoring state
     */
    public query func get_monitoring_state(challenge_id: Nat) : async Result.Result<MonitoringState, Error> {
        switch (monitoringStates.get(challenge_id)) {
            case (?state) { #ok(state) };
            case null { #err(#NotFound("No monitoring state found")) };
        }
    };
    
    /**
     * Gets evaluation history for a challenge
     * @param challenge_id Challenge identifier
     * @returns Array of evaluations
     */
    public query func get_evaluations(challenge_id: Nat) : async [Evaluation] {
        let challengeEvaluations = Array.filter<Evaluation>(
            Iter.toArray(evaluations.vals()),
            func(e) = e.challenge_id == challenge_id
        );
        Array.sort<Evaluation>(challengeEvaluations, func(a, b) = Int.compare(b.timestamp, a.timestamp))
    };
    
    /**
     * Gets balance history for a canister
     * @param canister_id Canister principal
     * @param limit Maximum number of snapshots to return
     * @returns Array of balance snapshots
     */
    public query func get_balance_history(canister_id: Principal, limit: Nat) : async [BalanceSnapshot] {
        let key = Principal.toText(canister_id);
        switch (balanceHistory.get(key)) {
            case (?history) {
                let maxLimit = Nat.min(limit, history.size());
                Array.tabulate<BalanceSnapshot>(maxLimit, func(i) = history[history.size() - maxLimit + i])
            };
            case null { [] };
        }
    };
    
    /**
     * Gets open disputes
     * @returns Array of open disputes
     */
    public query func get_open_disputes() : async [DisputeCase] {
        let openDisputes = Array.filter<DisputeCase>(
            Iter.toArray(disputes.vals()),
            func(d) = d.status == #Open or d.status == #UnderReview
        );
        Array.sort<DisputeCase>(openDisputes, func(a, b) = Int.compare(b.created_at, a.created_at))
    };
    
    // Private helper functions
    
    /**
     * Performs periodic monitoring checks
     */
    private func performPeriodicChecks() : async () {
        let currentTime = Time.now();
        
        for ((challengeId, state) in monitoringStates.entries()) {
            if (state.monitoring_active and (currentTime - state.last_check) >= BALANCE_CHECK_INTERVAL) {
                let currentBalance = await getCanisterBalance(state.target_canister);
                await recordBalanceSnapshot(state.target_canister, currentBalance);
                
                // Check for significant balance changes
                if (state.initial_balance > currentBalance) {
                    let decrease = state.initial_balance - currentBalance;
                    let decreasePercentage = (decrease * 100) / state.initial_balance;
                    
                    if (decreasePercentage >= ATTACK_THRESHOLD_PERCENTAGE and not state.attack_detected) {
                        Debug.print("Potential attack detected on challenge " # Nat.toText(challengeId));
                        // Could trigger additional verification here
                    };
                };
                
                // Update monitoring state
                let updatedState = {
                    state with
                    current_balance = currentBalance;
                    last_check = currentTime;
                };
                monitoringStates.put(challengeId, updatedState);
            };
        };
    };
    
    /**
     * Gets the current balance of a canister
     * Note: This is a simplified implementation. In practice, this would
     * interact with the ICP ledger or the canister's balance query method
     */
    private func getCanisterBalance(canister_id: Principal) : async Nat {
        // Simplified implementation - in reality this would query the actual balance
        // For demonstration purposes, we'll return a mock value
        try {
            let canister = actor(Principal.toText(canister_id)) : actor {
                get_balance : query () -> async Nat;
            };
            await canister.get_balance()
        } catch (error) {
            // If balance query fails, return 0
            Debug.print("Failed to get balance for canister " # Principal.toText(canister_id) # ": " # Error.message(error));
            0
        }
    };
    
    /**
     * Records a balance snapshot for historical tracking
     */
    private func recordBalanceSnapshot(canister_id: Principal, balance: Nat) : async () {
        let key = Principal.toText(canister_id);
        let snapshot: BalanceSnapshot = {
            canister_id = canister_id;
            balance = balance;
            timestamp = Time.now();
            block_height = null; // Could be populated with actual block height
        };
        
        let currentHistory = Option.get(balanceHistory.get(key), []);
        let updatedHistory = if (currentHistory.size() >= MAX_BALANCE_HISTORY) {
            // Remove oldest entry and add new one
            let buffer = Buffer.fromArray<BalanceSnapshot>(currentHistory);
            ignore buffer.remove(0);
            buffer.add(snapshot);
            Buffer.toArray(buffer)
        } else {
            Array.append<BalanceSnapshot>(currentHistory, [snapshot])
        };
        
        balanceHistory.put(key, updatedHistory);
    };
    
    /**
     * Triggers settlement through the Vault canister
     */
    private func triggerSettlement(challenge_id: Nat, winner: Principal) : async Result.Result<(), Error> {
        switch (vaultCanister) {
            case (?vault) {
                try {
                    let vaultActor = actor(Principal.toText(vault)) : actor {
                        unlock_funds : ({
                            challenge_id: Nat;
                            recipient: Principal;
                            amount: Nat;
                            reason: { #BountyPayout: Principal; #ChallengeExpired; #ChallengeCancelled; #AdminOverride: Text };
                        }) -> async Result.Result<(), Error>;
                    };
                    
                    // Get lock info to determine amount (simplified)
                    let unlockRequest = {
                        challenge_id = challenge_id;
                        recipient = winner;
                        amount = 1000000; // This should be retrieved from the actual lock
                        reason = #BountyPayout(winner);
                    };
                    
                    await vaultActor.unlock_funds(unlockRequest)
                } catch (error) {
                    #err(#InternalError("Failed to trigger settlement: " # Error.message(error)))
                }
            };
            case null {
                #err(#InternalError("Vault canister not configured"))
            };
        }
    };
    
    // Configuration functions
    
    /**
     * Sets the BountyFactory canister reference
     */
    public shared(msg) func set_bounty_factory(canister: Principal) : async Result.Result<(), Error> {
        // In production, this should be restricted to governance
        bountyFactoryCanister := ?canister;
        Debug.print("BountyFactory canister set: " # Principal.toText(canister));
        #ok()
    };
    
    /**
     * Sets the Vault canister reference
     */
    public shared(msg) func set_vault_canister(canister: Principal) : async Result.Result<(), Error> {
        // In production, this should be restricted to governance
        vaultCanister := ?canister;
        Debug.print("Vault canister set: " # Principal.toText(canister));
        #ok()
    };
    
    /**
     * Gets configuration information
     */
    public query func get_config() : async {
        bounty_factory: ?Principal;
        vault: ?Principal;
        balance_check_interval: Int;
        attack_threshold: Nat;
    } {
        {
            bounty_factory = bountyFactoryCanister;
            vault = vaultCanister;
            balance_check_interval = BALANCE_CHECK_INTERVAL;
            attack_threshold = ATTACK_THRESHOLD_PERCENTAGE;
        }
    };
}