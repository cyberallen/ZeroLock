import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Achievement {
  'id' : bigint,
  'recipient' : Principal,
  'description' : string,
  'achievement_type' : AchievementType,
  'timestamp' : bigint,
  'challenge_id' : [] | [bigint],
}
export type AchievementType = { 'QuickSolver' : null } |
  { 'GenerousCompany' : null } |
  { 'SerialHacker' : null } |
  { 'ActiveContributor' : null } |
  { 'FirstBlood' : null } |
  { 'TopEarner' : null };
export interface AttackAttempt {
  'id' : bigint,
  'timestamp' : bigint,
  'hacker' : Principal,
  'challenge_id' : bigint,
  'success' : boolean,
  'gas_used' : bigint,
  'proof' : [] | [Uint8Array | number[]],
}
export type AttackAttemptResult = { 'Ok' : AttackAttempt } |
  { 'Err' : ZeroLockError };
export type AttackAttemptsResult = { 'Ok' : Array<AttackAttempt> } |
  { 'Err' : ZeroLockError };
export interface Balance {
  'total' : bigint,
  'owner' : Principal,
  'locked' : bigint,
  'available' : bigint,
  'token_type' : TokenType,
}
export type BalanceResult = { 'Ok' : Balance } |
  { 'Err' : ZeroLockError };
export interface BalanceSnapshot {
  'balance' : bigint,
  'canister_id' : Principal,
  'timestamp' : bigint,
  'block_height' : [] | [bigint],
}
export type BalanceSnapshotsResult = { 'Ok' : Array<BalanceSnapshot> } |
  { 'Err' : ZeroLockError };
export type BalancesResult = { 'Ok' : Array<Balance> } |
  { 'Err' : ZeroLockError };
export interface Challenge {
  'id' : bigint,
  'status' : ChallengeStatus,
  'updated_at' : bigint,
  'candid_interface' : string,
  'description' : string,
  'created_at' : bigint,
  'end_time' : bigint,
  'company' : Principal,
  'start_time' : bigint,
  'bounty_amount' : bigint,
  'target_canister' : [] | [Principal],
  'token_type' : TokenType,
  'wasm_code' : Uint8Array | number[],
  'difficulty_level' : number,
}
export type ChallengeResult = { 'Ok' : Challenge } |
  { 'Err' : ZeroLockError };
export interface ChallengeStats {
  'total' : bigint,
  'active' : bigint,
  'cancelled' : bigint,
  'expired' : bigint,
  'completed' : bigint,
}
export type ChallengeStatsResult = { 'Ok' : ChallengeStats } |
  { 'Err' : ZeroLockError };
export type ChallengeStatus = { 'Active' : null } |
  { 'Cancelled' : null } |
  { 'Created' : null } |
  { 'Completed' : null } |
  { 'Expired' : null };
export type ChallengesResult = { 'Ok' : Array<Challenge> } |
  { 'Err' : ZeroLockError };
export interface CompanyLeaderboardEntry {
  'user_principal' : Principal,
  'rank' : bigint,
  'reputation' : bigint,
  'created_at' : bigint,
  'display_name' : [] | [string],
  'total_earned' : bigint,
  'challenges_completed' : bigint,
}
export interface CreateChallengeRequest {
  'candid_interface' : string,
  'description' : string,
  'duration_hours' : bigint,
  'bounty_amount' : bigint,
  'token_type' : TokenType,
  'wasm_code' : Uint8Array | number[],
  'difficulty_level' : number,
}
export interface DisputeCase {
  'id' : bigint,
  'status' : DisputeStatus,
  'disputer' : Principal,
  'created_at' : bigint,
  'resolution' : [] | [string],
  'evidence' : Array<Uint8Array | number[]>,
  'attack_attempt_id' : bigint,
  'challenge_id' : bigint,
  'resolved_at' : [] | [bigint],
  'reason' : string,
}
export type DisputeStatus = { 'UnderReview' : null } |
  { 'Open' : null } |
  { 'Rejected' : null } |
  { 'Resolved' : null };
export type DisputesResult = { 'Ok' : Array<DisputeCase> } |
  { 'Err' : ZeroLockError };
export interface Evaluation {
  'id' : bigint,
  'decision' : JudgeDecision,
  'evaluator' : Principal,
  'reasoning' : string,
  'attack_attempt_id' : bigint,
  'timestamp' : bigint,
  'challenge_id' : bigint,
}
export type EvaluationResult = { 'Ok' : Evaluation } |
  { 'Err' : ZeroLockError };
export type EvaluationsResult = { 'Ok' : Array<Evaluation> } |
  { 'Err' : ZeroLockError };
export type IdResult = { 'Ok' : bigint } |
  { 'Err' : ZeroLockError };
export type JudgeDecision = { 'Disputed' : null } |
  { 'Invalid' : null } |
  { 'Valid' : null } |
  { 'Pending' : null };
export interface LeaderboardEntry {
  'user_principal' : Principal,
  'rank' : bigint,
  'reputation' : bigint,
  'created_at' : bigint,
  'display_name' : [] | [string],
  'total_earned' : bigint,
  'challenges_completed' : bigint,
}
export interface LockInfo {
  'status' : LockStatus,
  'locked_at' : bigint,
  'company' : Principal,
  'challenge_id' : bigint,
  'amount' : bigint,
  'expires_at' : bigint,
  'token_type' : TokenType,
}
export type LockInfoResult = { 'Ok' : LockInfo } |
  { 'Err' : ZeroLockError };
export interface LockRequest {
  'duration' : bigint,
  'company' : Principal,
  'challenge_id' : bigint,
  'amount' : bigint,
  'token_type' : TokenType,
}
export type LockStatus = { 'Active' : null } |
  { 'Released' : null } |
  { 'Expired' : null };
export interface MonitoringState {
  'attack_detected' : boolean,
  'initial_balance' : bigint,
  'current_balance' : bigint,
  'monitoring_active' : boolean,
  'target_canister' : Principal,
  'challenge_id' : bigint,
  'last_check' : bigint,
}
export type MonitoringStateResult = { 'Ok' : MonitoringState } |
  { 'Err' : ZeroLockError };
export interface PlatformStats {
  'successful_attacks' : bigint,
  'total_companies' : bigint,
  'total_bounties_paid' : bigint,
  'total_hackers' : bigint,
  'total_bounty_paid' : bigint,
  'active_challenges' : bigint,
  'completed_challenges' : bigint,
  'total_challenges' : bigint,
}
export type PlatformStatsResult = { 'Ok' : PlatformStats } |
  { 'Err' : ZeroLockError };
export type Principal = Principal;
export type PrincipalsResult = { 'Ok' : Array<Principal> } |
  { 'Err' : ZeroLockError };
export type Result = { 'Ok' : null } |
  { 'Err' : ZeroLockError };
export type TokenType = { 'ICP' : null } |
  { 'ICRC1' : Principal };
export interface Transaction {
  'id' : bigint,
  'to' : Principal,
  'status' : TransactionStatus,
  'transaction_type' : TransactionType,
  'from' : Principal,
  'timestamp' : bigint,
  'challenge_id' : bigint,
  'amount' : bigint,
  'token_type' : TokenType,
}
export type TransactionStatus = { 'Failed' : null } |
  { 'Cancelled' : null } |
  { 'Completed' : null } |
  { 'Pending' : null };
export type TransactionType = { 'Fee' : null } |
  { 'Payout' : null } |
  { 'Lock' : null } |
  { 'Refund' : null } |
  { 'Unlock' : null };
export type TransactionsResult = { 'Ok' : Array<Transaction> } |
  { 'Err' : ZeroLockError };
export type UnlockReason = { 'BountyPayout' : Principal } |
  { 'ChallengeExpired' : null } |
  { 'ChallengeCancelled' : null } |
  { 'AdminOverride' : string };
export interface UnlockRequest {
  'recipient' : Principal,
  'challenge_id' : bigint,
  'amount' : bigint,
  'reason' : UnlockReason,
}
export interface UserProfile {
  'user_principal' : Principal,
  'username' : string,
  'role' : UserRole,
  'reputation' : bigint,
  'created_at' : bigint,
  'total_earned' : bigint,
  'challenges_completed' : bigint,
}
export type UserProfileResult = {
    'Ok' : [
      UserProfile,
      [] | [string],
      Array<Achievement>,
      BigUint64Array | bigint[],
    ]
  } |
  { 'Err' : ZeroLockError };
export type UserRole = { 'Company' : null } |
  { 'Admin' : null } |
  { 'Hacker' : null };
export interface UserStats {
  'total_users' : bigint,
  'active_companies' : bigint,
  'active_hackers' : bigint,
  'new_users_last_week' : bigint,
}
export type UserStatsResult = { 'Ok' : UserStats } |
  { 'Err' : ZeroLockError };
export interface VaultStats {
  'total_transactions' : bigint,
  'active_locks' : bigint,
  'total_locked' : bigint,
  'total_volume' : bigint,
}
export type VaultStatsResult = { 'Ok' : VaultStats } |
  { 'Err' : ZeroLockError };
export type ZeroLockError = { 'InvalidInput' : string } |
  { 'NetworkError' : string } |
  { 'NotFound' : string } |
  { 'Unauthorized' : string } |
  { 'AlreadyExists' : string } |
  { 'InternalError' : string } |
  { 'ResourceLimit' : string } |
  { 'InvalidState' : string } |
  { 'InsufficientFunds' : string };
export interface _SERVICE {
  'add_admin' : ActorMethod<[Principal], Result>,
  'add_authorized_canister' : ActorMethod<[Principal], Result>,
  'create_challenge' : ActorMethod<[CreateChallengeRequest], IdResult>,
  'create_dispute' : ActorMethod<
    [bigint, bigint, string, Array<Uint8Array | number[]>],
    IdResult
  >,
  'deploy_target_canister' : ActorMethod<
    [bigint],
    { 'Ok' : Principal } |
      { 'Err' : ZeroLockError }
  >,
  'deposit' : ActorMethod<[TokenType, bigint], IdResult>,
  'evaluate_attack' : ActorMethod<[bigint, AttackAttempt], EvaluationResult>,
  'expire_challenge' : ActorMethod<[bigint], Result>,
  'get_admins' : ActorMethod<[], Array<Principal>>,
  'get_authorized_canisters' : ActorMethod<[], Array<Principal>>,
  'get_balance' : ActorMethod<[Principal, TokenType], BalanceResult>,
  'get_balance_history' : ActorMethod<
    [Principal, bigint],
    Array<BalanceSnapshot>
  >,
  'get_challenge' : ActorMethod<[bigint], ChallengeResult>,
  'get_challenge_stats' : ActorMethod<[], ChallengeStats>,
  'get_company_challenges' : ActorMethod<[Principal], Array<Challenge>>,
  'get_company_leaderboard' : ActorMethod<
    [bigint],
    Array<CompanyLeaderboardEntry>
  >,
  'get_evaluations' : ActorMethod<[bigint], Array<Evaluation>>,
  'get_hacker_leaderboard' : ActorMethod<[bigint], Array<LeaderboardEntry>>,
  'get_lock_info' : ActorMethod<[bigint], LockInfoResult>,
  'get_monitoring_state' : ActorMethod<[bigint], MonitoringStateResult>,
  'get_open_disputes' : ActorMethod<[], Array<DisputeCase>>,
  'get_platform_stats' : ActorMethod<[], PlatformStats>,
  'get_transaction_history' : ActorMethod<
    [Principal, bigint, bigint],
    Array<Transaction>
  >,
  'get_user_profile' : ActorMethod<
    [Principal],
    {
        'Ok' : [
          UserProfile,
          [] | [string],
          Array<Achievement>,
          BigUint64Array | bigint[],
        ]
      } |
      { 'Err' : ZeroLockError }
  >,
  'get_user_stats' : ActorMethod<[], UserStats>,
  'get_vault_stats' : ActorMethod<[], VaultStats>,
  'is_paused' : ActorMethod<[], boolean>,
  'list_challenges' : ActorMethod<
    [[] | [ChallengeStatus], bigint, bigint],
    Array<Challenge>
  >,
  'lock_funds' : ActorMethod<[LockRequest], Result>,
  'record_challenge_creation' : ActorMethod<
    [Principal, bigint, TokenType],
    { 'Ok' : null } |
      { 'Err' : ZeroLockError }
  >,
  'record_successful_attack' : ActorMethod<
    [Principal, bigint, bigint, TokenType],
    { 'Ok' : null } |
      { 'Err' : ZeroLockError }
  >,
  'register_user' : ActorMethod<
    [UserRole],
    { 'Ok' : null } |
      { 'Err' : ZeroLockError }
  >,
  'remove_admin' : ActorMethod<[Principal], Result>,
  'resolve_dispute' : ActorMethod<[bigint, JudgeDecision, string], Result>,
  'set_bounty_factory' : ActorMethod<[Principal], Result>,
  'set_bounty_factory_for_leaderboard' : ActorMethod<
    [Principal],
    { 'Ok' : null } |
      { 'Err' : ZeroLockError }
  >,
  'set_display_name' : ActorMethod<
    [string],
    { 'Ok' : null } |
      { 'Err' : ZeroLockError }
  >,
  'set_pause_status' : ActorMethod<[boolean], Result>,
  'set_platform_fee_recipient' : ActorMethod<[Principal], Result>,
  'set_vault_canister' : ActorMethod<[Principal], Result>,
  'start_monitoring' : ActorMethod<[bigint, Principal], Result>,
  'stop_monitoring' : ActorMethod<[bigint], Result>,
  'unlock_funds' : ActorMethod<[UnlockRequest], Result>,
  'update_challenge_status' : ActorMethod<[bigint, ChallengeStatus], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
