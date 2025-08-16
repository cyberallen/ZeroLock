export const idlFactory = ({ IDL }) => {
  const ZeroLockError = IDL.Variant({
    'InvalidInput' : IDL.Text,
    'NetworkError' : IDL.Text,
    'NotFound' : IDL.Text,
    'Unauthorized' : IDL.Text,
    'AlreadyExists' : IDL.Text,
    'InternalError' : IDL.Text,
    'ResourceLimit' : IDL.Text,
    'InvalidState' : IDL.Text,
    'InsufficientFunds' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : ZeroLockError });
  const TokenType = IDL.Variant({ 'ICP' : IDL.Null, 'ICRC1' : IDL.Principal });
  const CreateChallengeRequest = IDL.Record({
    'candid_interface' : IDL.Text,
    'description' : IDL.Text,
    'duration_hours' : IDL.Nat64,
    'bounty_amount' : IDL.Nat64,
    'token_type' : TokenType,
    'wasm_code' : IDL.Vec(IDL.Nat8),
    'difficulty_level' : IDL.Nat8,
  });
  const IdResult = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : ZeroLockError });
  const AttackAttempt = IDL.Record({
    'id' : IDL.Nat64,
    'timestamp' : IDL.Int64,
    'hacker' : IDL.Principal,
    'challenge_id' : IDL.Nat64,
    'success' : IDL.Bool,
    'gas_used' : IDL.Nat64,
    'proof' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const JudgeDecision = IDL.Variant({
    'Disputed' : IDL.Null,
    'Invalid' : IDL.Null,
    'Valid' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const Evaluation = IDL.Record({
    'id' : IDL.Nat64,
    'decision' : JudgeDecision,
    'evaluator' : IDL.Principal,
    'reasoning' : IDL.Text,
    'attack_attempt_id' : IDL.Nat64,
    'timestamp' : IDL.Int64,
    'challenge_id' : IDL.Nat64,
  });
  const EvaluationResult = IDL.Variant({
    'Ok' : Evaluation,
    'Err' : ZeroLockError,
  });
  const Balance = IDL.Record({
    'total' : IDL.Nat64,
    'owner' : IDL.Principal,
    'locked' : IDL.Nat64,
    'available' : IDL.Nat64,
    'token_type' : TokenType,
  });
  const BalanceResult = IDL.Variant({ 'Ok' : Balance, 'Err' : ZeroLockError });
  const BalanceSnapshot = IDL.Record({
    'balance' : IDL.Nat64,
    'canister_id' : IDL.Principal,
    'timestamp' : IDL.Int64,
    'block_height' : IDL.Opt(IDL.Nat64),
  });
  const ChallengeStatus = IDL.Variant({
    'Active' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Created' : IDL.Null,
    'Completed' : IDL.Null,
    'Expired' : IDL.Null,
  });
  const Challenge = IDL.Record({
    'id' : IDL.Nat64,
    'status' : ChallengeStatus,
    'updated_at' : IDL.Int64,
    'candid_interface' : IDL.Text,
    'description' : IDL.Text,
    'created_at' : IDL.Int64,
    'end_time' : IDL.Int64,
    'company' : IDL.Principal,
    'start_time' : IDL.Int64,
    'bounty_amount' : IDL.Nat64,
    'target_canister' : IDL.Opt(IDL.Principal),
    'token_type' : TokenType,
    'wasm_code' : IDL.Vec(IDL.Nat8),
    'difficulty_level' : IDL.Nat8,
  });
  const ChallengeResult = IDL.Variant({
    'Ok' : Challenge,
    'Err' : ZeroLockError,
  });
  const ChallengeStats = IDL.Record({
    'total' : IDL.Nat64,
    'active' : IDL.Nat64,
    'cancelled' : IDL.Nat64,
    'expired' : IDL.Nat64,
    'completed' : IDL.Nat64,
  });
  const CompanyLeaderboardEntry = IDL.Record({
    'user_principal' : IDL.Principal,
    'rank' : IDL.Nat64,
    'reputation' : IDL.Nat64,
    'created_at' : IDL.Int64,
    'display_name' : IDL.Opt(IDL.Text),
    'total_earned' : IDL.Nat64,
    'challenges_completed' : IDL.Nat64,
  });
  const LeaderboardEntry = IDL.Record({
    'user_principal' : IDL.Principal,
    'rank' : IDL.Nat64,
    'reputation' : IDL.Nat64,
    'created_at' : IDL.Int64,
    'display_name' : IDL.Opt(IDL.Text),
    'total_earned' : IDL.Nat64,
    'challenges_completed' : IDL.Nat64,
  });
  const LockStatus = IDL.Variant({
    'Active' : IDL.Null,
    'Released' : IDL.Null,
    'Expired' : IDL.Null,
  });
  const LockInfo = IDL.Record({
    'status' : LockStatus,
    'locked_at' : IDL.Int64,
    'company' : IDL.Principal,
    'challenge_id' : IDL.Nat64,
    'amount' : IDL.Nat64,
    'expires_at' : IDL.Int64,
    'token_type' : TokenType,
  });
  const LockInfoResult = IDL.Variant({
    'Ok' : LockInfo,
    'Err' : ZeroLockError,
  });
  const MonitoringState = IDL.Record({
    'attack_detected' : IDL.Bool,
    'initial_balance' : IDL.Nat64,
    'current_balance' : IDL.Nat64,
    'monitoring_active' : IDL.Bool,
    'target_canister' : IDL.Principal,
    'challenge_id' : IDL.Nat64,
    'last_check' : IDL.Int64,
  });
  const MonitoringStateResult = IDL.Variant({
    'Ok' : MonitoringState,
    'Err' : ZeroLockError,
  });
  const DisputeStatus = IDL.Variant({
    'UnderReview' : IDL.Null,
    'Open' : IDL.Null,
    'Rejected' : IDL.Null,
    'Resolved' : IDL.Null,
  });
  const DisputeCase = IDL.Record({
    'id' : IDL.Nat64,
    'status' : DisputeStatus,
    'disputer' : IDL.Principal,
    'created_at' : IDL.Int64,
    'resolution' : IDL.Opt(IDL.Text),
    'evidence' : IDL.Vec(IDL.Vec(IDL.Nat8)),
    'attack_attempt_id' : IDL.Nat64,
    'challenge_id' : IDL.Nat64,
    'resolved_at' : IDL.Opt(IDL.Int64),
    'reason' : IDL.Text,
  });
  const PlatformStats = IDL.Record({
    'successful_attacks' : IDL.Nat64,
    'total_companies' : IDL.Nat64,
    'total_bounties_paid' : IDL.Nat64,
    'total_hackers' : IDL.Nat64,
    'total_bounty_paid' : IDL.Nat64,
    'active_challenges' : IDL.Nat64,
    'completed_challenges' : IDL.Nat64,
    'total_challenges' : IDL.Nat64,
  });
  const TransactionStatus = IDL.Variant({
    'Failed' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Completed' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const TransactionType = IDL.Variant({
    'Fee' : IDL.Null,
    'Payout' : IDL.Null,
    'Lock' : IDL.Null,
    'Refund' : IDL.Null,
    'Unlock' : IDL.Null,
  });
  const Transaction = IDL.Record({
    'id' : IDL.Nat64,
    'to' : IDL.Principal,
    'status' : TransactionStatus,
    'transaction_type' : TransactionType,
    'from' : IDL.Principal,
    'timestamp' : IDL.Int64,
    'challenge_id' : IDL.Nat64,
    'amount' : IDL.Nat64,
    'token_type' : TokenType,
  });
  const UserRole = IDL.Variant({
    'Company' : IDL.Null,
    'Admin' : IDL.Null,
    'Hacker' : IDL.Null,
  });
  const UserProfile = IDL.Record({
    'user_principal' : IDL.Principal,
    'username' : IDL.Text,
    'role' : UserRole,
    'reputation' : IDL.Nat64,
    'created_at' : IDL.Nat64,
    'total_earned' : IDL.Nat64,
    'challenges_completed' : IDL.Nat64,
  });
  const AchievementType = IDL.Variant({
    'QuickSolver' : IDL.Null,
    'GenerousCompany' : IDL.Null,
    'SerialHacker' : IDL.Null,
    'ActiveContributor' : IDL.Null,
    'FirstBlood' : IDL.Null,
    'TopEarner' : IDL.Null,
  });
  const Achievement = IDL.Record({
    'id' : IDL.Nat64,
    'recipient' : IDL.Principal,
    'description' : IDL.Text,
    'achievement_type' : AchievementType,
    'timestamp' : IDL.Int64,
    'challenge_id' : IDL.Opt(IDL.Nat64),
  });
  const UserStats = IDL.Record({
    'total_users' : IDL.Nat64,
    'active_companies' : IDL.Nat64,
    'active_hackers' : IDL.Nat64,
    'new_users_last_week' : IDL.Nat64,
  });
  const VaultStats = IDL.Record({
    'total_transactions' : IDL.Nat64,
    'active_locks' : IDL.Nat64,
    'total_locked' : IDL.Nat64,
    'total_volume' : IDL.Nat64,
  });
  const LockRequest = IDL.Record({
    'duration' : IDL.Int64,
    'company' : IDL.Principal,
    'challenge_id' : IDL.Nat64,
    'amount' : IDL.Nat64,
    'token_type' : TokenType,
  });
  const UnlockReason = IDL.Variant({
    'BountyPayout' : IDL.Principal,
    'ChallengeExpired' : IDL.Null,
    'ChallengeCancelled' : IDL.Null,
    'AdminOverride' : IDL.Text,
  });
  const UnlockRequest = IDL.Record({
    'recipient' : IDL.Principal,
    'challenge_id' : IDL.Nat64,
    'amount' : IDL.Nat64,
    'reason' : UnlockReason,
  });
  return IDL.Service({
    'add_admin' : IDL.Func([IDL.Principal], [Result], []),
    'add_authorized_canister' : IDL.Func([IDL.Principal], [Result], []),
    'create_challenge' : IDL.Func([CreateChallengeRequest], [IdResult], []),
    'create_dispute' : IDL.Func(
        [IDL.Nat64, IDL.Nat64, IDL.Text, IDL.Vec(IDL.Vec(IDL.Nat8))],
        [IdResult],
        [],
      ),
    'deploy_target_canister' : IDL.Func(
        [IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Principal, 'Err' : ZeroLockError })],
        [],
      ),
    'deposit' : IDL.Func([TokenType, IDL.Nat64], [IdResult], []),
    'evaluate_attack' : IDL.Func(
        [IDL.Nat64, AttackAttempt],
        [EvaluationResult],
        [],
      ),
    'expire_challenge' : IDL.Func([IDL.Nat64], [Result], []),
    'get_admins' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'get_authorized_canisters' : IDL.Func(
        [],
        [IDL.Vec(IDL.Principal)],
        ['query'],
      ),
    'get_balance' : IDL.Func(
        [IDL.Principal, TokenType],
        [BalanceResult],
        ['query'],
      ),
    'get_balance_history' : IDL.Func(
        [IDL.Principal, IDL.Nat64],
        [IDL.Vec(BalanceSnapshot)],
        ['query'],
      ),
    'get_challenge' : IDL.Func([IDL.Nat64], [ChallengeResult], ['query']),
    'get_challenge_stats' : IDL.Func([], [ChallengeStats], ['query']),
    'get_company_challenges' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(Challenge)],
        ['query'],
      ),
    'get_company_leaderboard' : IDL.Func(
        [IDL.Nat64],
        [IDL.Vec(CompanyLeaderboardEntry)],
        ['query'],
      ),
    'get_evaluations' : IDL.Func([IDL.Nat64], [IDL.Vec(Evaluation)], ['query']),
    'get_hacker_leaderboard' : IDL.Func(
        [IDL.Nat64],
        [IDL.Vec(LeaderboardEntry)],
        ['query'],
      ),
    'get_lock_info' : IDL.Func([IDL.Nat64], [LockInfoResult], ['query']),
    'get_monitoring_state' : IDL.Func(
        [IDL.Nat64],
        [MonitoringStateResult],
        ['query'],
      ),
    'get_open_disputes' : IDL.Func([], [IDL.Vec(DisputeCase)], ['query']),
    'get_platform_stats' : IDL.Func([], [PlatformStats], ['query']),
    'get_transaction_history' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Nat64],
        [IDL.Vec(Transaction)],
        ['query'],
      ),
    'get_user_profile' : IDL.Func(
        [IDL.Principal],
        [
          IDL.Variant({
            'Ok' : IDL.Tuple(
              UserProfile,
              IDL.Opt(IDL.Text),
              IDL.Vec(Achievement),
              IDL.Vec(IDL.Nat64),
            ),
            'Err' : ZeroLockError,
          }),
        ],
        ['query'],
      ),
    'get_user_stats' : IDL.Func([], [UserStats], ['query']),
    'get_vault_stats' : IDL.Func([], [VaultStats], ['query']),
    'is_paused' : IDL.Func([], [IDL.Bool], ['query']),
    'list_challenges' : IDL.Func(
        [IDL.Opt(ChallengeStatus), IDL.Nat64, IDL.Nat64],
        [IDL.Vec(Challenge)],
        ['query'],
      ),
    'lock_funds' : IDL.Func([LockRequest], [Result], []),
    'record_challenge_creation' : IDL.Func(
        [IDL.Principal, IDL.Nat64, TokenType],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : ZeroLockError })],
        [],
      ),
    'record_successful_attack' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Nat64, TokenType],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : ZeroLockError })],
        [],
      ),
    'register_user' : IDL.Func(
        [UserRole],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : ZeroLockError })],
        [],
      ),
    'remove_admin' : IDL.Func([IDL.Principal], [Result], []),
    'resolve_dispute' : IDL.Func(
        [IDL.Nat64, JudgeDecision, IDL.Text],
        [Result],
        [],
      ),
    'set_bounty_factory' : IDL.Func([IDL.Principal], [Result], []),
    'set_bounty_factory_for_leaderboard' : IDL.Func(
        [IDL.Principal],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : ZeroLockError })],
        [],
      ),
    'set_display_name' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : ZeroLockError })],
        [],
      ),
    'set_pause_status' : IDL.Func([IDL.Bool], [Result], []),
    'set_platform_fee_recipient' : IDL.Func([IDL.Principal], [Result], []),
    'set_vault_canister' : IDL.Func([IDL.Principal], [Result], []),
    'start_monitoring' : IDL.Func([IDL.Nat64, IDL.Principal], [Result], []),
    'stop_monitoring' : IDL.Func([IDL.Nat64], [Result], []),
    'unlock_funds' : IDL.Func([UnlockRequest], [Result], []),
    'update_challenge_status' : IDL.Func(
        [IDL.Nat64, ChallengeStatus],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
