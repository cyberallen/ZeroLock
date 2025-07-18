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
import Types "./Types";

/**
 * Vault Canister - Secure asset management for ZeroLock platform
 * Handles fund locking, automatic settlements, and multi-token support
 */
actor Vault {
    
    // Import types from shared module
    type TokenType = Types.TokenType;
    type TransactionType = Types.TransactionType;
    type Transaction = Types.Transaction;
    type TransactionStatus = Types.TransactionStatus;
    type Error = Types.Error;
    type Event = Types.Event;
    
    // Vault-specific types
    public type Balance = {
        owner: Principal;
        token_type: TokenType;
        available: Nat;
        locked: Nat;
        total: Nat;
    };
    
    public type LockRequest = {
        challenge_id: Nat;
        company: Principal;
        amount: Nat;
        token_type: TokenType;
        duration: Int; // Lock duration in nanoseconds
    };
    
    public type UnlockRequest = {
        challenge_id: Nat;
        recipient: Principal;
        amount: Nat;
        reason: UnlockReason;
    };
    
    public type UnlockReason = {
        #BountyPayout: Principal; // Hacker who earned the bounty
        #ChallengeExpired;
        #ChallengeCancelled;
        #AdminOverride: Text;
    };
    
    public type VaultStats = {
        total_locked: Nat;
        total_transactions: Nat;
        active_locks: Nat;
        total_volume: Nat;
    };
    
    // State variables
    private stable var nextTransactionId: Nat = 1;
    private stable var transactionEntries: [(Nat, Transaction)] = [];
    private stable var balanceEntries: [(Text, Balance)] = []; // Key: principal#token_type
    private stable var lockEntries: [(Nat, LockInfo)] = []; // Key: challenge_id
    
    private var transactions = HashMap.HashMap<Nat, Transaction>(10, Nat.equal, Nat.hash);
    private var balances = HashMap.HashMap<Text, Balance>(10, Text.equal, Text.hash);
    private var locks = HashMap.HashMap<Nat, LockInfo>(10, Nat.equal, Nat.hash);
    
    // Lock information
    private type LockInfo = {
        challenge_id: Nat;
        company: Principal;
        amount: Nat;
        token_type: TokenType;
        locked_at: Int;
        expires_at: Int;
        status: LockStatus;
    };
    
    private type LockStatus = {
        #Active;
        #Released;
        #Expired;
    };
    
    // Configuration
    private let PLATFORM_FEE_BASIS_POINTS: Nat = 250; // 2.5%
    private let MAX_LOCK_DURATION: Int = 30 * 24 * 3600 * 1_000_000_000; // 30 days in nanoseconds
    private let MIN_LOCK_AMOUNT: Nat = 1_000_000; // 0.01 ICP in e8s
    
    // Platform fee recipient (should be governance-controlled in production)
    private stable var platformFeeRecipient: Principal = Principal.fromText("rdmx6-jaaaa-aaaah-qcaiq-cai");
    
    // Authorized canisters (BountyFactory, Judge)
    private stable var authorizedCanisters: [Principal] = [];
    
    // System upgrade hooks
    system func preupgrade() {
        transactionEntries := Iter.toArray(transactions.entries());
        balanceEntries := Iter.toArray(balances.entries());
        lockEntries := Iter.toArray(locks.entries());
    };
    
    system func postupgrade() {
        transactions := HashMap.fromIter<Nat, Transaction>(
            transactionEntries.vals(), transactionEntries.size(), Nat.equal, Nat.hash
        );
        balances := HashMap.fromIter<Text, Balance>(
            balanceEntries.vals(), balanceEntries.size(), Text.equal, Text.hash
        );
        locks := HashMap.fromIter<Nat, LockInfo>(
            lockEntries.vals(), lockEntries.size(), Nat.equal, Nat.hash
        );
        
        transactionEntries := [];
        balanceEntries := [];
        lockEntries := [];
    };
    
    /**
     * Deposits funds into the vault
     * @param token_type Type of token being deposited
     * @param amount Amount to deposit
     * @returns Transaction ID on success
     */
    public shared(msg) func deposit(token_type: TokenType, amount: Nat) : async Result.Result<Nat, Error> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err(#Unauthorized("Anonymous principals cannot deposit"));
        };
        
        if (amount == 0) {
            return #err(#InvalidInput("Deposit amount must be greater than zero"));
        };
        
        // In a real implementation, this would interact with ICP ledger or ICRC-1 tokens
        // For now, we'll simulate the deposit
        
        let balanceKey = makeBalanceKey(caller, token_type);
        let currentBalance = Option.get(balances.get(balanceKey), {
            owner = caller;
            token_type = token_type;
            available = 0;
            locked = 0;
            total = 0;
        });
        
        let newBalance = {
            currentBalance with
            available = currentBalance.available + amount;
            total = currentBalance.total + amount;
        };
        
        balances.put(balanceKey, newBalance);
        
        // Record transaction
        let transactionId = nextTransactionId;
        nextTransactionId += 1;
        
        let transaction: Transaction = {
            id = transactionId;
            transaction_type = #Lock; // Using Lock as deposit type
            challenge_id = 0; // No specific challenge for deposits
            from = caller;
            to = Principal.fromActor(Vault);
            amount = amount;
            token_type = token_type;
            timestamp = Time.now();
            status = #Completed;
        };
        
        transactions.put(transactionId, transaction);
        
        Debug.print("Deposit completed: User=" # Principal.toText(caller) # ", Amount=" # Nat.toText(amount));
        #ok(transactionId)
    };
    
    /**
     * Locks funds for a challenge
     * @param request Lock request parameters
     * @returns Success or error
     */
    public shared(msg) func lock_funds(request: LockRequest) : async Result.Result<(), Error> {
        let caller = msg.caller;
        
        // Verify caller is authorized (BountyFactory)
        if (not isAuthorizedCanister(caller)) {
            return #err(#Unauthorized("Only authorized canisters can lock funds"));
        };
        
        // Validate request
        if (request.amount < MIN_LOCK_AMOUNT) {
            return #err(#InvalidInput("Lock amount below minimum threshold"));
        };
        
        if (request.duration > MAX_LOCK_DURATION) {
            return #err(#InvalidInput("Lock duration exceeds maximum allowed"));
        };
        
        // Check if challenge already has locked funds
        switch (locks.get(request.challenge_id)) {
            case (?existingLock) {
                if (existingLock.status == #Active) {
                    return #err(#InvalidState("Funds already locked for this challenge"));
                };
            };
            case null {};
        };
        
        // Check company balance
        let balanceKey = makeBalanceKey(request.company, request.token_type);
        switch (balances.get(balanceKey)) {
            case (?balance) {
                if (balance.available < request.amount) {
                    return #err(#InsufficientFunds("Insufficient available balance"));
                };
                
                // Update balance (move from available to locked)
                let updatedBalance = {
                    balance with
                    available = balance.available - request.amount;
                    locked = balance.locked + request.amount;
                };
                
                balances.put(balanceKey, updatedBalance);
            };
            case null {
                return #err(#InsufficientFunds("No balance found for this token type"));
            };
        };
        
        // Create lock record
        let currentTime = Time.now();
        let lockInfo: LockInfo = {
            challenge_id = request.challenge_id;
            company = request.company;
            amount = request.amount;
            token_type = request.token_type;
            locked_at = currentTime;
            expires_at = currentTime + request.duration;
            status = #Active;
        };
        
        locks.put(request.challenge_id, lockInfo);
        
        // Record transaction
        let transactionId = nextTransactionId;
        nextTransactionId += 1;
        
        let transaction: Transaction = {
            id = transactionId;
            transaction_type = #Lock;
            challenge_id = request.challenge_id;
            from = request.company;
            to = Principal.fromActor(Vault);
            amount = request.amount;
            token_type = request.token_type;
            timestamp = currentTime;
            status = #Completed;
        };
        
        transactions.put(transactionId, transaction);
        
        Debug.print("Funds locked: Challenge=" # Nat.toText(request.challenge_id) # ", Amount=" # Nat.toText(request.amount));
        #ok()
    };
    
    /**
     * Unlocks and transfers funds based on challenge outcome
     * @param request Unlock request parameters
     * @returns Success or error
     */
    public shared(msg) func unlock_funds(request: UnlockRequest) : async Result.Result<(), Error> {
        let caller = msg.caller;
        
        // Verify caller is authorized (Judge canister)
        if (not isAuthorizedCanister(caller)) {
            return #err(#Unauthorized("Only authorized canisters can unlock funds"));
        };
        
        // Get lock information
        switch (locks.get(request.challenge_id)) {
            case (?lockInfo) {
                if (lockInfo.status != #Active) {
                    return #err(#InvalidState("Lock is not active"));
                };
                
                if (request.amount > lockInfo.amount) {
                    return #err(#InvalidInput("Unlock amount exceeds locked amount"));
                };
                
                // Calculate platform fee and net payout
                let (netAmount, platformFee) = switch (request.reason) {
                    case (#BountyPayout(_)) {
                        let fee = (request.amount * PLATFORM_FEE_BASIS_POINTS) / 10000;
                        (request.amount - fee, fee)
                    };
                    case (_) { (request.amount, 0) }; // No fee for refunds/cancellations
                };
                
                // Update company balance (reduce locked amount)
                let companyBalanceKey = makeBalanceKey(lockInfo.company, lockInfo.token_type);
                switch (balances.get(companyBalanceKey)) {
                    case (?companyBalance) {
                        let updatedCompanyBalance = {
                            companyBalance with
                            locked = companyBalance.locked - request.amount;
                            total = companyBalance.total - request.amount;
                        };
                        balances.put(companyBalanceKey, updatedCompanyBalance);
                    };
                    case null {
                        return #err(#InternalError("Company balance not found"));
                    };
                };
                
                // Transfer to recipient
                if (netAmount > 0) {
                    let recipientBalanceKey = makeBalanceKey(request.recipient, lockInfo.token_type);
                    let recipientBalance = Option.get(balances.get(recipientBalanceKey), {
                        owner = request.recipient;
                        token_type = lockInfo.token_type;
                        available = 0;
                        locked = 0;
                        total = 0;
                    });
                    
                    let updatedRecipientBalance = {
                        recipientBalance with
                        available = recipientBalance.available + netAmount;
                        total = recipientBalance.total + netAmount;
                    };
                    
                    balances.put(recipientBalanceKey, updatedRecipientBalance);
                };
                
                // Handle platform fee
                if (platformFee > 0) {
                    let feeBalanceKey = makeBalanceKey(platformFeeRecipient, lockInfo.token_type);
                    let feeBalance = Option.get(balances.get(feeBalanceKey), {
                        owner = platformFeeRecipient;
                        token_type = lockInfo.token_type;
                        available = 0;
                        locked = 0;
                        total = 0;
                    });
                    
                    let updatedFeeBalance = {
                        feeBalance with
                        available = feeBalance.available + platformFee;
                        total = feeBalance.total + platformFee;
                    };
                    
                    balances.put(feeBalanceKey, updatedFeeBalance);
                };
                
                // Update lock status
                let updatedLock = {
                    lockInfo with
                    status = #Released;
                };
                locks.put(request.challenge_id, updatedLock);
                
                // Record transactions
                let currentTime = Time.now();
                
                // Main payout transaction
                if (netAmount > 0) {
                    let payoutTransactionId = nextTransactionId;
                    nextTransactionId += 1;
                    
                    let payoutTransaction: Transaction = {
                        id = payoutTransactionId;
                        transaction_type = #Payout;
                        challenge_id = request.challenge_id;
                        from = lockInfo.company;
                        to = request.recipient;
                        amount = netAmount;
                        token_type = lockInfo.token_type;
                        timestamp = currentTime;
                        status = #Completed;
                    };
                    
                    transactions.put(payoutTransactionId, payoutTransaction);
                };
                
                // Platform fee transaction
                if (platformFee > 0) {
                    let feeTransactionId = nextTransactionId;
                    nextTransactionId += 1;
                    
                    let feeTransaction: Transaction = {
                        id = feeTransactionId;
                        transaction_type = #Fee;
                        challenge_id = request.challenge_id;
                        from = lockInfo.company;
                        to = platformFeeRecipient;
                        amount = platformFee;
                        token_type = lockInfo.token_type;
                        timestamp = currentTime;
                        status = #Completed;
                    };
                    
                    transactions.put(feeTransactionId, feeTransaction);
                };
                
                Debug.print("Funds unlocked: Challenge=" # Nat.toText(request.challenge_id) # ", Recipient=" # Principal.toText(request.recipient) # ", Amount=" # Nat.toText(netAmount));
                #ok()
            };
            case null {
                #err(#NotFound("No locked funds found for this challenge"))
            };
        }
    };
    
    /**
     * Gets balance for a user and token type
     * @param user Principal of the user
     * @param token_type Type of token
     * @returns Balance information
     */
    public query func get_balance(user: Principal, token_type: TokenType) : async Result.Result<Balance, Error> {
        let balanceKey = makeBalanceKey(user, token_type);
        switch (balances.get(balanceKey)) {
            case (?balance) { #ok(balance) };
            case null {
                #ok({
                    owner = user;
                    token_type = token_type;
                    available = 0;
                    locked = 0;
                    total = 0;
                })
            };
        }
    };
    
    /**
     * Gets lock information for a challenge
     * @param challenge_id Challenge identifier
     * @returns Lock information
     */
    public query func get_lock_info(challenge_id: Nat) : async Result.Result<LockInfo, Error> {
        switch (locks.get(challenge_id)) {
            case (?lockInfo) { #ok(lockInfo) };
            case null { #err(#NotFound("No lock found for this challenge")) };
        }
    };
    
    /**
     * Gets transaction history for a user
     * @param user Principal of the user
     * @param offset Pagination offset
     * @param limit Maximum number of results
     * @returns Array of transactions
     */
    public query func get_transaction_history(user: Principal, offset: Nat, limit: Nat) : async [Transaction] {
        let maxLimit = 100;
        let actualLimit = if (limit > maxLimit) maxLimit else limit;
        
        let userTransactions = Array.filter<Transaction>(
            Iter.toArray(transactions.vals()),
            func(t) = t.from == user or t.to == user
        );
        
        let sortedTransactions = Array.sort<Transaction>(
            userTransactions,
            func(a, b) = Int.compare(b.timestamp, a.timestamp)
        );
        
        if (offset >= sortedTransactions.size()) {
            return [];
        };
        
        let endIndex = Nat.min(offset + actualLimit, sortedTransactions.size());
        Array.tabulate<Transaction>(endIndex - offset, func(i) = sortedTransactions[offset + i])
    };
    
    /**
     * Gets vault statistics
     * @returns Vault statistics
     */
    public query func get_vault_stats() : async VaultStats {
        var totalLocked = 0;
        var activeLocks = 0;
        var totalVolume = 0;
        
        for (lockInfo in locks.vals()) {
            if (lockInfo.status == #Active) {
                totalLocked += lockInfo.amount;
                activeLocks += 1;
            };
        };
        
        for (transaction in transactions.vals()) {
            if (transaction.status == #Completed) {
                totalVolume += transaction.amount;
            };
        };
        
        {
            total_locked = totalLocked;
            total_transactions = transactions.size();
            active_locks = activeLocks;
            total_volume = totalVolume;
        }
    };
    
    // Private helper functions
    
    /**
     * Creates a unique key for balance storage
     */
    private func makeBalanceKey(principal: Principal, tokenType: TokenType) : Text {
        let tokenStr = switch (tokenType) {
            case (#ICP) { "ICP" };
            case (#ICRC1(p)) { "ICRC1:" # Principal.toText(p) };
        };
        Principal.toText(principal) # "#" # tokenStr
    };
    
    /**
     * Checks if a canister is authorized to call vault functions
     */
    private func isAuthorizedCanister(canister: Principal) : Bool {
        Array.find<Principal>(authorizedCanisters, func(p) = p == canister) != null
    };
    
    // Admin functions
    
    /**
     * Adds an authorized canister
     */
    public shared(msg) func add_authorized_canister(canister: Principal) : async Result.Result<(), Error> {
        // In production, this should be restricted to governance
        let caller = msg.caller;
        
        if (isAuthorizedCanister(canister)) {
            return #err(#InvalidInput("Canister is already authorized"));
        };
        
        let canisterBuffer = Buffer.fromArray<Principal>(authorizedCanisters);
        canisterBuffer.add(canister);
        authorizedCanisters := Buffer.toArray(canisterBuffer);
        
        Debug.print("Authorized canister added: " # Principal.toText(canister));
        #ok()
    };
    
    /**
     * Gets list of authorized canisters
     */
    public query func get_authorized_canisters() : async [Principal] {
        authorizedCanisters
    };
    
    /**
     * Emergency function to pause all operations
     */
    private stable var isPaused: Bool = false;
    
    public shared(msg) func set_pause_status(paused: Bool) : async Result.Result<(), Error> {
        // In production, this should be restricted to governance
        isPaused := paused;
        Debug.print("Vault pause status set to: " # debug_show(paused));
        #ok()
    };
    
    public query func is_paused() : async Bool {
        isPaused
    };
}