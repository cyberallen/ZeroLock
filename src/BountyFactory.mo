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
import Blob "mo:base/Blob";
import IC "mo:base/ExperimentalInternetComputer";

/**
 * BountyFactory Canister - Core module for ZeroLock security bounty platform
 * Manages the complete lifecycle of security challenges on ICP blockchain
 */
actor BountyFactory {
    
    // Type definitions
    public type TokenType = {
        #ICP;
        #ICRC1: Principal;
    };
    
    public type ChallengeStatus = {
        #Created;
        #Active;
        #Completed;
        #Expired;
        #Cancelled;
    };
    
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
        difficulty_level: Nat;
        created_at: Int;
        updated_at: Int;
    };
    
    public type ChallengeStats = {
        total: Nat;
        active: Nat;
        completed: Nat;
        expired: Nat;
        cancelled: Nat;
    };
    
    public type CreateChallengeRequest = {
        wasm_code: Blob;
        candid_interface: Text;
        bounty_amount: Nat;
        duration_hours: Nat;
        token_type: TokenType;
        description: Text;
        difficulty_level: Nat;
    };
    
    // Error types
    public type Error = {
        #NotFound: Text;
        #Unauthorized: Text;
        #InvalidInput: Text;
        #InternalError: Text;
        #ResourceLimit: Text;
        #InvalidState: Text;
    };
    
    // State variables
    private stable var nextChallengeId: Nat = 1;
    private stable var challengeEntries: [(Nat, Challenge)] = [];
    private var challenges = HashMap.HashMap<Nat, Challenge>(10, Nat.equal, Nat.hash);
    
    // Configuration constants
    private let MAX_CHALLENGES_PER_USER: Nat = 10;
    private let MIN_BOUNTY_AMOUNT: Nat = 1_000_000; // 0.01 ICP in e8s
    private let MAX_DURATION_HOURS: Nat = 720; // 30 days
    private let MIN_DURATION_HOURS: Nat = 24; // 1 day
    private let MAX_WASM_SIZE: Nat = 2_000_000; // 2MB
    private let MAX_DESCRIPTION_LENGTH: Nat = 1000;
    
    // Admin principals (in production, this should be managed through governance)
    private stable var admins: [Principal] = [];
    
    // System upgrade hooks
    system func preupgrade() {
        challengeEntries := Iter.toArray(challenges.entries());
    };
    
    system func postupgrade() {
        challenges := HashMap.fromIter<Nat, Challenge>(
            challengeEntries.vals(), challengeEntries.size(), Nat.equal, Nat.hash
        );
        challengeEntries := [];
    };
    
    // Heartbeat for periodic tasks
    system func heartbeat() : async () {
        await checkExpiredChallenges();
    };
    
    /**
     * Creates a new security challenge
     * @param request Challenge creation parameters
     * @returns Challenge ID on success, error on failure
     */
    public shared(msg) func create_challenge(request: CreateChallengeRequest) : async Result.Result<Nat, Error> {
        let caller = msg.caller;
        
        // Validate caller is not anonymous
        if (Principal.isAnonymous(caller)) {
            return #err(#Unauthorized("Anonymous principals cannot create challenges"));
        };
        
        // Validate input parameters
        switch (validateChallengeRequest(request)) {
            case (#err(error)) { return #err(error); };
            case (#ok()) {};
        };
        
        // Check user challenge limit
        let userChallengeCount = countUserChallenges(caller);
        if (userChallengeCount >= MAX_CHALLENGES_PER_USER) {
            return #err(#ResourceLimit("Maximum challenges per user exceeded"));
        };
        
        let currentTime = Time.now();
        let challengeId = nextChallengeId;
        nextChallengeId += 1;
        
        let challenge: Challenge = {
            id = challengeId;
            company = caller;
            target_canister = null;
            wasm_code = request.wasm_code;
            candid_interface = request.candid_interface;
            bounty_amount = request.bounty_amount;
            token_type = request.token_type;
            start_time = currentTime;
            end_time = currentTime + (request.duration_hours * 3600 * 1_000_000_000); // Convert hours to nanoseconds
            status = #Created;
            description = request.description;
            difficulty_level = request.difficulty_level;
            created_at = currentTime;
            updated_at = currentTime;
        };
        
        challenges.put(challengeId, challenge);
        
        // Log challenge creation event
        Debug.print("Challenge created: ID=" # Nat.toText(challengeId) # ", Company=" # Principal.toText(caller));
        
        #ok(challengeId)
    };
    
    /**
     * Retrieves a challenge by ID
     * @param id Challenge identifier
     * @returns Challenge data or error if not found
     */
    public query func get_challenge(id: Nat) : async Result.Result<Challenge, Error> {
        switch (challenges.get(id)) {
            case (?challenge) { #ok(challenge) };
            case null { #err(#NotFound("Challenge not found")) };
        }
    };
    
    /**
     * Lists challenges with optional filtering and pagination
     * @param status Optional status filter
     * @param offset Pagination offset
     * @param limit Maximum number of results
     * @returns Array of challenges
     */
    public query func list_challenges(status: ?ChallengeStatus, offset: Nat, limit: Nat) : async [Challenge] {
        let maxLimit = 100;
        let actualLimit = if (limit > maxLimit) maxLimit else limit;
        
        let allChallenges = Iter.toArray(challenges.vals());
        let filteredChallenges = switch (status) {
            case (?s) { Array.filter<Challenge>(allChallenges, func(c) = c.status == s) };
            case null { allChallenges };
        };
        
        let sortedChallenges = Array.sort<Challenge>(filteredChallenges, func(a, b) = Int.compare(b.created_at, a.created_at));
        
        if (offset >= sortedChallenges.size()) {
            return [];
        };
        
        let endIndex = Nat.min(offset + actualLimit, sortedChallenges.size());
        Array.tabulate<Challenge>(endIndex - offset, func(i) = sortedChallenges[offset + i])
    };
    
    /**
     * Updates challenge status (restricted to authorized callers)
     * @param id Challenge identifier
     * @param newStatus New status to set
     * @returns Success or error
     */
    public shared(msg) func update_challenge_status(id: Nat, newStatus: ChallengeStatus) : async Result.Result<(), Error> {
        let caller = msg.caller;
        
        switch (challenges.get(id)) {
            case (?challenge) {
                // Check authorization
                if (not (caller == challenge.company or isAdmin(caller))) {
                    return #err(#Unauthorized("Not authorized to update this challenge"));
                };
                
                // Validate status transition
                switch (validateStatusTransition(challenge.status, newStatus)) {
                    case (#err(error)) { return #err(error); };
                    case (#ok()) {};
                };
                
                let updatedChallenge = {
                    challenge with
                    status = newStatus;
                    updated_at = Time.now();
                };
                
                challenges.put(id, updatedChallenge);
                
                Debug.print("Challenge status updated: ID=" # Nat.toText(id) # ", Status=" # debug_show(newStatus));
                #ok()
            };
            case null { #err(#NotFound("Challenge not found")) };
        }
    };
    
    /**
     * Deploys the target canister for a challenge
     * @param challenge_id Challenge identifier
     * @returns Principal of deployed canister or error
     */
    public shared(msg) func deploy_target_canister(challenge_id: Nat) : async Result.Result<Principal, Error> {
        let caller = msg.caller;
        
        switch (challenges.get(challenge_id)) {
            case (?challenge) {
                // Check authorization
                if (not (caller == challenge.company or isAdmin(caller))) {
                    return #err(#Unauthorized("Not authorized to deploy canister for this challenge"));
                };
                
                // Check challenge status
                if (challenge.status != #Created) {
                    return #err(#InvalidState("Challenge must be in Created status to deploy canister"));
                };
                
                // Deploy canister using IC management canister
                try {
                    let ic = actor("aaaaa-aa") : actor {
                        create_canister : { settings: ?{} } -> async { canister_id: Principal };
                        install_code : {
                            mode: { #install };
                            canister_id: Principal;
                            wasm_module: Blob;
                            arg: Blob;
                        } -> async ();
                    };
                    
                    let canister_result = await ic.create_canister({ settings = null });
                    let canister_id = canister_result.canister_id;
                    
                    await ic.install_code({
                        mode = #install;
                        canister_id = canister_id;
                        wasm_module = challenge.wasm_code;
                        arg = Blob.fromArray([]);
                    });
                    
                    // Update challenge with deployed canister
                    let updatedChallenge = {
                        challenge with
                        target_canister = ?canister_id;
                        status = #Active;
                        updated_at = Time.now();
                    };
                    
                    challenges.put(challenge_id, updatedChallenge);
                    
                    Debug.print("Target canister deployed: Challenge=" # Nat.toText(challenge_id) # ", Canister=" # Principal.toText(canister_id));
                    #ok(canister_id)
                } catch (error) {
                    #err(#InternalError("Failed to deploy canister: " # Error.message(error)))
                }
            };
            case null { #err(#NotFound("Challenge not found")) };
        }
    };
    
    /**
     * Manually expires a challenge
     * @param id Challenge identifier
     * @returns Success or error
     */
    public shared(msg) func expire_challenge(id: Nat) : async Result.Result<(), Error> {
        let caller = msg.caller;
        
        switch (challenges.get(id)) {
            case (?challenge) {
                // Check authorization
                if (not (caller == challenge.company or isAdmin(caller))) {
                    return #err(#Unauthorized("Not authorized to expire this challenge"));
                };
                
                // Check if challenge can be expired
                if (challenge.status == #Completed or challenge.status == #Expired or challenge.status == #Cancelled) {
                    return #err(#InvalidState("Challenge is already in final state"));
                };
                
                let updatedChallenge = {
                    challenge with
                    status = #Expired;
                    updated_at = Time.now();
                };
                
                challenges.put(id, updatedChallenge);
                
                Debug.print("Challenge expired: ID=" # Nat.toText(id));
                #ok()
            };
            case null { #err(#NotFound("Challenge not found")) };
        }
    };
    
    /**
     * Gets challenge statistics
     * @returns Statistics object with counts by status
     */
    public query func get_challenge_stats() : async ChallengeStats {
        var total = 0;
        var active = 0;
        var completed = 0;
        var expired = 0;
        var cancelled = 0;
        
        for (challenge in challenges.vals()) {
            total += 1;
            switch (challenge.status) {
                case (#Active) { active += 1; };
                case (#Completed) { completed += 1; };
                case (#Expired) { expired += 1; };
                case (#Cancelled) { cancelled += 1; };
                case (#Created) { /* Count as neither active nor completed */ };
            };
        };
        
        {
            total = total;
            active = active;
            completed = completed;
            expired = expired;
            cancelled = cancelled;
        }
    };
    
    /**
     * Gets challenges created by a specific company
     * @param company Principal of the company
     * @returns Array of challenges
     */
    public query func get_company_challenges(company: Principal) : async [Challenge] {
        let companyChallenges = Array.filter<Challenge>(
            Iter.toArray(challenges.vals()),
            func(c) = c.company == company
        );
        Array.sort<Challenge>(companyChallenges, func(a, b) = Int.compare(b.created_at, a.created_at))
    };
    
    // Private helper functions
    
    /**
     * Validates challenge creation request
     */
    private func validateChallengeRequest(request: CreateChallengeRequest) : Result.Result<(), Error> {
        // Validate WASM size
        if (request.wasm_code.size() > MAX_WASM_SIZE) {
            return #err(#InvalidInput("WASM code exceeds maximum size limit"));
        };
        
        if (request.wasm_code.size() == 0) {
            return #err(#InvalidInput("WASM code cannot be empty"));
        };
        
        // Validate bounty amount
        if (request.bounty_amount < MIN_BOUNTY_AMOUNT) {
            return #err(#InvalidInput("Bounty amount below minimum threshold"));
        };
        
        // Validate duration
        if (request.duration_hours < MIN_DURATION_HOURS or request.duration_hours > MAX_DURATION_HOURS) {
            return #err(#InvalidInput("Duration must be between " # Nat.toText(MIN_DURATION_HOURS) # " and " # Nat.toText(MAX_DURATION_HOURS) # " hours"));
        };
        
        // Validate description
        if (Text.size(request.description) > MAX_DESCRIPTION_LENGTH) {
            return #err(#InvalidInput("Description exceeds maximum length"));
        };
        
        // Validate difficulty level
        if (request.difficulty_level < 1 or request.difficulty_level > 5) {
            return #err(#InvalidInput("Difficulty level must be between 1 and 5"));
        };
        
        // Validate Candid interface is not empty
        if (Text.size(request.candid_interface) == 0) {
            return #err(#InvalidInput("Candid interface cannot be empty"));
        };
        
        #ok()
    };
    
    /**
     * Validates status transitions
     */
    private func validateStatusTransition(currentStatus: ChallengeStatus, newStatus: ChallengeStatus) : Result.Result<(), Error> {
        switch (currentStatus, newStatus) {
            case (#Created, #Active) { #ok() };
            case (#Created, #Cancelled) { #ok() };
            case (#Active, #Completed) { #ok() };
            case (#Active, #Expired) { #ok() };
            case (#Active, #Cancelled) { #ok() };
            case (_, _) {
                if (currentStatus == newStatus) {
                    #ok() // Allow setting same status
                } else {
                    #err(#InvalidState("Invalid status transition"))
                }
            };
        }
    };
    
    /**
     * Counts challenges created by a user
     */
    private func countUserChallenges(user: Principal) : Nat {
        var count = 0;
        for (challenge in challenges.vals()) {
            if (challenge.company == user) {
                count += 1;
            };
        };
        count
    };
    
    /**
     * Checks if a principal is an admin
     */
    private func isAdmin(principal: Principal) : Bool {
        Array.find<Principal>(admins, func(p) = p == principal) != null
    };
    
    /**
     * Periodic task to check and expire challenges
     */
    private func checkExpiredChallenges() : async () {
        let currentTime = Time.now();
        
        for ((id, challenge) in challenges.entries()) {
            if (challenge.status == #Active and currentTime > challenge.end_time) {
                let updatedChallenge = {
                    challenge with
                    status = #Expired;
                    updated_at = currentTime;
                };
                challenges.put(id, updatedChallenge);
                Debug.print("Auto-expired challenge: ID=" # Nat.toText(id));
            };
        };
    };
    
    // Admin functions
    
    /**
     * Adds an admin (only callable by existing admins or during initialization)
     */
    public shared(msg) func add_admin(new_admin: Principal) : async Result.Result<(), Error> {
        let caller = msg.caller;
        
        if (admins.size() > 0 and not isAdmin(caller)) {
            return #err(#Unauthorized("Only admins can add new admins"));
        };
        
        if (isAdmin(new_admin)) {
            return #err(#InvalidInput("Principal is already an admin"));
        };
        
        let adminBuffer = Buffer.fromArray<Principal>(admins);
        adminBuffer.add(new_admin);
        admins := Buffer.toArray(adminBuffer);
        
        Debug.print("Admin added: " # Principal.toText(new_admin));
        #ok()
    };
    
    /**
     * Gets the list of admin principals
     */
    public query func get_admins() : async [Principal] {
        admins
    };
}