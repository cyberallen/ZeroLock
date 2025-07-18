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
 * Leaderboard Canister - Tracks and displays platform statistics and user rankings
 * Maintains reputation scores, challenge history, and platform-wide metrics
 */
actor Leaderboard {
    
    // Import types from shared module
    type UserProfile = Types.UserProfile;
    type UserRole = Types.UserRole;
    type PlatformStats = Types.PlatformStats;
    type Challenge = Types.Challenge;
    type Error = Types.Error;
    
    // Leaderboard-specific types
    public type LeaderboardEntry = {
        rank: Nat;
        principal: Principal;
        display_name: ?Text;
        reputation_score: Nat;
        successful_attacks: Nat;
        total_bounties_earned: Nat;
        last_active: Int;
    };
    
    public type CompanyLeaderboardEntry = {
        rank: Nat;
        principal: Principal;
        display_name: ?Text;
        reputation_score: Nat;
        total_challenges: Nat;
        total_bounties_paid: Nat;
        last_active: Int;
    };
    
    public type AchievementType = {
        #FirstBlood;        // First successful attack
        #TopEarner;         // Earned the most bounties
        #SerialHacker;      // Completed multiple challenges
        #QuickSolver;       // Solved a challenge quickly
        #GenerousCompany;   // Offered high bounties
        #ActiveContributor; // Created many challenges
    };
    
    public type Achievement = {
        id: Nat;
        achievement_type: AchievementType;
        recipient: Principal;
        timestamp: Int;
        description: Text;
        challenge_id: ?Nat;
    };
    
    public type UserStats = {
        total_users: Nat;
        active_hackers: Nat;
        active_companies: Nat;
        new_users_last_week: Nat;
    };
    
    // State variables
    private stable var nextAchievementId: Nat = 1;
    
    private stable var userProfileEntries: [(Principal, UserProfile)] = [];
    private stable var displayNameEntries: [(Principal, Text)] = [];
    private stable var achievementEntries: [(Nat, Achievement)] = [];
    private stable var challengeHistoryEntries: [(Principal, [Nat])] = []; // User -> Challenge IDs
    
    private var userProfiles = HashMap.HashMap<Principal, UserProfile>(10, Principal.equal, Principal.hash);
    private var displayNames = HashMap.HashMap<Principal, Text>(10, Principal.equal, Principal.hash);
    private var achievements = HashMap.HashMap<Nat, Achievement>(10, Nat.equal, Nat.hash);
    private var challengeHistory = HashMap.HashMap<Principal, [Nat]>(10, Principal.equal, Principal.hash);
    
    // Platform statistics
    private stable var platformStats: PlatformStats = {
        total_challenges = 0;
        active_challenges = 0;
        completed_challenges = 0;
        total_bounty_paid = 0;
        total_hackers = 0;
        total_companies = 0;
    };
    
    // External canister references
    private stable var bountyFactoryCanister: ?Principal = null;
    
    // System upgrade hooks
    system func preupgrade() {
        userProfileEntries := Iter.toArray(userProfiles.entries());
        displayNameEntries := Iter.toArray(displayNames.entries());
        achievementEntries := Iter.toArray(achievements.entries());
        challengeHistoryEntries := Iter.toArray(challengeHistory.entries());
    };
    
    system func postupgrade() {
        userProfiles := HashMap.fromIter<Principal, UserProfile>(
            userProfileEntries.vals(), userProfileEntries.size(), Principal.equal, Principal.hash
        );
        displayNames := HashMap.fromIter<Principal, Text>(
            displayNameEntries.vals(), displayNameEntries.size(), Principal.equal, Principal.hash
        );
        achievements := HashMap.fromIter<Nat, Achievement>(
            achievementEntries.vals(), achievementEntries.size(), Nat.equal, Nat.hash
        );
        challengeHistory := HashMap.fromIter<Principal, [Nat]>(
            challengeHistoryEntries.vals(), challengeHistoryEntries.size(), Principal.equal, Principal.hash
        );
        
        userProfileEntries := [];
        displayNameEntries := [];
        achievementEntries := [];
        challengeHistoryEntries := [];
    };
    
    /**
     * Creates or updates a user profile
     * @param role User role (Hacker or Company)
     * @returns Success or error
     */
    public shared(msg) func register_user(role: UserRole) : async Result.Result<(), Error> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err(#Unauthorized("Anonymous principals cannot register"));
        };
        
        let currentTime = Time.now();
        
        switch (userProfiles.get(caller)) {
            case (?existingProfile) {
                // Update existing profile
                let updatedProfile = {
                    existingProfile with
                    role = role;
                    last_active = currentTime;
                };
                userProfiles.put(caller, updatedProfile);
            };
            case null {
                // Create new profile
                let newProfile: UserProfile = {
                    principal = caller;
                    role = role;
                    reputation_score = 100; // Starting reputation
                    total_bounties_earned = 0;
                    total_bounties_offered = 0;
                    successful_attacks = 0;
                    created_challenges = 0;
                    joined_at = currentTime;
                    last_active = currentTime;
                };
                userProfiles.put(caller, newProfile);
                
                // Update platform stats
                platformStats := {
                    platformStats with
                    total_hackers = if (role == #Hacker) platformStats.total_hackers + 1 else platformStats.total_hackers;
                    total_companies = if (role == #Company) platformStats.total_companies + 1 else platformStats.total_companies;
                };
            };
        };
        
        Debug.print("User registered: " # Principal.toText(caller) # ", Role=" # debug_show(role));
        #ok()
    };
    
    /**
     * Sets a display name for a user
     * @param display_name Display name to set
     * @returns Success or error
     */
    public shared(msg) func set_display_name(display_name: Text) : async Result.Result<(), Error> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err(#Unauthorized("Anonymous principals cannot set display name"));
        };
        
        if (Text.size(display_name) == 0 or Text.size(display_name) > 50) {
            return #err(#InvalidInput("Display name must be between 1 and 50 characters"));
        };
        
        // Check if user profile exists
        switch (userProfiles.get(caller)) {
            case (?_) {
                displayNames.put(caller, display_name);
                #ok()
            };
            case null {
                #err(#NotFound("User profile not found. Please register first"))
            };
        }
    };
    
    /**
     * Records a successful attack
     * @param challenge_id Challenge identifier
     * @param hacker Principal of the successful hacker
     * @param bounty_amount Amount of bounty earned
     * @returns Success or error
     */
    public shared(msg) func record_successful_attack(challenge_id: Nat, hacker: Principal, bounty_amount: Nat) : async Result.Result<(), Error> {
        let caller = msg.caller;
        
        // Verify caller is authorized (BountyFactory or Judge)
        switch (bountyFactoryCanister) {
            case (?factory) {
                if (caller != factory) {
                    return #err(#Unauthorized("Only authorized canisters can record attacks"));
                };
            };
            case null {
                return #err(#InternalError("BountyFactory canister not configured"));
            };
        };
        
        // Update hacker profile
        switch (userProfiles.get(hacker)) {
            case (?profile) {
                let updatedProfile = {
                    profile with
                    successful_attacks = profile.successful_attacks + 1;
                    total_bounties_earned = profile.total_bounties_earned + bounty_amount;
                    reputation_score = profile.reputation_score + 10; // Increase reputation
                    last_active = Time.now();
                };
                userProfiles.put(hacker, updatedProfile);
                
                // Update challenge history
                let currentHistory = Option.get(challengeHistory.get(hacker), []);
                let updatedHistory = Array.append<Nat>(currentHistory, [challenge_id]);
                challengeHistory.put(hacker, updatedHistory);
                
                // Check for achievements
                if (profile.successful_attacks == 0) {
                    await grantAchievement(hacker, #FirstBlood, ?challenge_id);
                };
                
                if (profile.successful_attacks == 4) { // 5th successful attack
                    await grantAchievement(hacker, #SerialHacker, null);
                };
            };
            case null {
                // Create profile if it doesn't exist
                let newProfile: UserProfile = {
                    principal = hacker;
                    role = #Hacker;
                    reputation_score = 110; // Starting + first success
                    total_bounties_earned = bounty_amount;
                    total_bounties_offered = 0;
                    successful_attacks = 1;
                    created_challenges = 0;
                    joined_at = Time.now();
                    last_active = Time.now();
                };
                userProfiles.put(hacker, newProfile);
                challengeHistory.put(hacker, [challenge_id]);
                
                // Grant first blood achievement
                await grantAchievement(hacker, #FirstBlood, ?challenge_id);
                
                // Update platform stats
                platformStats := {
                    platformStats with
                    total_hackers = platformStats.total_hackers + 1;
                };
            };
        };
        
        // Update platform stats
        platformStats := {
            platformStats with
            completed_challenges = platformStats.completed_challenges + 1;
            active_challenges = if (platformStats.active_challenges > 0) platformStats.active_challenges - 1 else 0;
            total_bounty_paid = platformStats.total_bounty_paid + bounty_amount;
        };
        
        Debug.print("Successful attack recorded: Challenge=" # Nat.toText(challenge_id) # ", Hacker=" # Principal.toText(hacker));
        #ok()
    };
    
    /**
     * Records a new challenge creation
     * @param challenge_id Challenge identifier
     * @param company Principal of the company
     * @param bounty_amount Bounty amount offered
     * @returns Success or error
     */
    public shared(msg) func record_challenge_created(challenge_id: Nat, company: Principal, bounty_amount: Nat) : async Result.Result<(), Error> {
        let caller = msg.caller;
        
        // Verify caller is authorized (BountyFactory)
        switch (bountyFactoryCanister) {
            case (?factory) {
                if (caller != factory) {
                    return #err(#Unauthorized("Only BountyFactory can record challenges"));
                };
            };
            case null {
                return #err(#InternalError("BountyFactory canister not configured"));
            };
        };
        
        // Update company profile
        switch (userProfiles.get(company)) {
            case (?profile) {
                let updatedProfile = {
                    profile with
                    created_challenges = profile.created_challenges + 1;
                    total_bounties_offered = profile.total_bounties_offered + bounty_amount;
                    reputation_score = profile.reputation_score + 5; // Increase reputation
                    last_active = Time.now();
                };
                userProfiles.put(company, updatedProfile);
                
                // Check for achievements
                if (profile.created_challenges == 4) { // 5th challenge
                    await grantAchievement(company, #ActiveContributor, null);
                };
                
                if (bounty_amount >= 1_000_000_000) { // 10 ICP or more
                    await grantAchievement(company, #GenerousCompany, ?challenge_id);
                };
            };
            case null {
                // Create profile if it doesn't exist
                let newProfile: UserProfile = {
                    principal = company;
                    role = #Company;
                    reputation_score = 105; // Starting + first challenge
                    total_bounties_earned = 0;
                    total_bounties_offered = bounty_amount;
                    successful_attacks = 0;
                    created_challenges = 1;
                    joined_at = Time.now();
                    last_active = Time.now();
                };
                userProfiles.put(company, newProfile);
                
                // Update platform stats
                platformStats := {
                    platformStats with
                    total_companies = platformStats.total_companies + 1;
                };
            };
        };
        
        // Update platform stats
        platformStats := {
            platformStats with
            total_challenges = platformStats.total_challenges + 1;
            active_challenges = platformStats.active_challenges + 1;
        };
        
        Debug.print("Challenge created: ID=" # Nat.toText(challenge_id) # ", Company=" # Principal.toText(company));
        #ok()
    };
    
    /**
     * Gets the hacker leaderboard
     * @param limit Maximum number of entries
     * @returns Array of leaderboard entries
     */
    public query func get_hacker_leaderboard(limit: Nat) : async [LeaderboardEntry] {
        let maxLimit = 100;
        let actualLimit = if (limit > maxLimit) maxLimit else limit;
        
        let hackers = Array.filter<(Principal, UserProfile)>(
            Iter.toArray(userProfiles.entries()),
            func((_, profile)) = profile.role == #Hacker
        );
        
        // Sort by reputation score
        let sortedHackers = Array.sort<(Principal, UserProfile)>(
            hackers,
            func((_, a), (_, b)) = Nat.compare(b.reputation_score, a.reputation_score)
        );
        
        let resultSize = Nat.min(actualLimit, sortedHackers.size());
        Array.tabulate<LeaderboardEntry>(resultSize, func(i) {
            let (principal, profile) = sortedHackers[i];
            {
                rank = i + 1;
                principal = principal;
                display_name = displayNames.get(principal);
                reputation_score = profile.reputation_score;
                successful_attacks = profile.successful_attacks;
                total_bounties_earned = profile.total_bounties_earned;
                last_active = profile.last_active;
            }
        })
    };
    
    /**
     * Gets the company leaderboard
     * @param limit Maximum number of entries
     * @returns Array of company leaderboard entries
     */
    public query func get_company_leaderboard(limit: Nat) : async [CompanyLeaderboardEntry] {
        let maxLimit = 100;
        let actualLimit = if (limit > maxLimit) maxLimit else limit;
        
        let companies = Array.filter<(Principal, UserProfile)>(
            Iter.toArray(userProfiles.entries()),
            func((_, profile)) = profile.role == #Company
        );
        
        // Sort by reputation score
        let sortedCompanies = Array.sort<(Principal, UserProfile)>(
            companies,
            func((_, a), (_, b)) = Nat.compare(b.reputation_score, a.reputation_score)
        );
        
        let resultSize = Nat.min(actualLimit, sortedCompanies.size());
        Array.tabulate<CompanyLeaderboardEntry>(resultSize, func(i) {
            let (principal, profile) = sortedCompanies[i];
            {
                rank = i + 1;
                principal = principal;
                display_name = displayNames.get(principal);
                reputation_score = profile.reputation_score;
                total_challenges = profile.created_challenges;
                total_bounties_paid = profile.total_bounties_offered;
                last_active = profile.last_active;
            }
        })
    };
    
    /**
     * Gets a user profile
     * @param user Principal of the user
     * @returns User profile or error
     */
    public query func get_user_profile(user: Principal) : async Result.Result<{
        profile: UserProfile;
        display_name: ?Text;
        achievements: [Achievement];
        challenge_history: [Nat];
    }, Error> {
        switch (userProfiles.get(user)) {
            case (?profile) {
                let userAchievements = Array.filter<Achievement>(
                    Iter.toArray(achievements.vals()),
                    func(a) = a.recipient == user
                );
                
                let userChallenges = Option.get(challengeHistory.get(user), []);
                
                #ok({
                    profile = profile;
                    display_name = displayNames.get(user);
                    achievements = userAchievements;
                    challenge_history = userChallenges;
                })
            };
            case null {
                #err(#NotFound("User profile not found"))
            };
        }
    };
    
    /**
     * Gets platform statistics
     * @returns Platform statistics
     */
    public query func get_platform_stats() : async PlatformStats {
        platformStats
    };
    
    /**
     * Gets user statistics
     * @returns User statistics
     */
    public query func get_user_stats() : async UserStats {
        let currentTime = Time.now();
        let oneWeekAgo = currentTime - (7 * 24 * 3600 * 1_000_000_000); // 7 days in nanoseconds
        
        let activeHackers = Array.filter<(Principal, UserProfile)>(
            Iter.toArray(userProfiles.entries()),
            func((_, profile)) = profile.role == #Hacker and profile.last_active > (currentTime - (30 * 24 * 3600 * 1_000_000_000))
        ).size();
        
        let activeCompanies = Array.filter<(Principal, UserProfile)>(
            Iter.toArray(userProfiles.entries()),
            func((_, profile)) = profile.role == #Company and profile.last_active > (currentTime - (30 * 24 * 3600 * 1_000_000_000))
        ).size();
        
        let newUsers = Array.filter<(Principal, UserProfile)>(
            Iter.toArray(userProfiles.entries()),
            func((_, profile)) = profile.joined_at > oneWeekAgo
        ).size();
        
        {
            total_users = userProfiles.size();
            active_hackers = activeHackers;
            active_companies = activeCompanies;
            new_users_last_week = newUsers;
        }
    };
    
    // Private helper functions
    
    /**
     * Grants an achievement to a user
     */
    private func grantAchievement(recipient: Principal, achievement_type: AchievementType, challenge_id: ?Nat) : async () {
        let achievementId = nextAchievementId;
        nextAchievementId += 1;
        
        let description = switch (achievement_type) {
            case (#FirstBlood) { "Completed first successful attack" };
            case (#TopEarner) { "Earned significant bounties" };
            case (#SerialHacker) { "Completed 5 successful attacks" };
            case (#QuickSolver) { "Solved a challenge in record time" };
            case (#GenerousCompany) { "Offered a high-value bounty" };
            case (#ActiveContributor) { "Created 5 challenges" };
        };
        
        let achievement: Achievement = {
            id = achievementId;
            achievement_type = achievement_type;
            recipient = recipient;
            timestamp = Time.now();
            description = description;
            challenge_id = challenge_id;
        };
        
        achievements.put(achievementId, achievement);
        Debug.print("Achievement granted: " # description # " to " # Principal.toText(recipient));
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
}