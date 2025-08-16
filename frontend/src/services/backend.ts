import { HttpAgent, Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { createAgent, createActor } from './agent';
import { getEnvConfig } from '@/utils/env';

// 导入生成的 Candid 绑定
import { 
  idlFactory as backendIdlFactory,
} from '../declarations/backend';

// 导入 Candid 类型，包括 _SERVICE
import type {
  _SERVICE as BackendService,
  Challenge,
  ChallengeStatus,
  TokenType,
  UserRole,
  Transaction,
  Balance,
  UserProfile,
  AttackAttempt,
  CreateChallengeRequest,
  LockRequest,
  UnlockRequest,
  PlatformStats,
  UserStats,
  ChallengeStats,
  VaultStats,
  LeaderboardEntry,
  CompanyLeaderboardEntry,
  Evaluation,
  DisputeCase,
  BalanceSnapshot,
  MonitoringState,
  ZeroLockError
} from '../declarations/backend/backend.did';

const config = getEnvConfig();

export class ZeroLockBackendService {
  private actor: BackendService | null = null;
  private agent: HttpAgent | null = null;
  private identity: Identity | null = null;

  constructor(identity?: Identity) {
    this.identity = identity || null;
  }

  // 初始化服务
  async initialize(identity?: Identity): Promise<void> {
    if (identity) {
      this.identity = identity;
    }
    
    this.agent = await createAgent(this.identity || undefined);
    this.actor = createActor<BackendService>(
      config.BOUNTY_FACTORY_CANISTER_ID, // 统一后端服务使用同一个 canister ID
      backendIdlFactory,
      this.agent
    );
  }

  // 获取 actor 实例
  private getActor(): BackendService {
    if (!this.actor) {
      throw new Error('Service not initialized. Call initialize() first.');
    }
    return this.actor;
  }

  // ===== BountyFactory 模块方法 =====

  /**
   * 创建挑战
   */
  async createChallenge(request: CreateChallengeRequest): Promise<ApiResponse<bigint>> {
    const actor = this.getActor();
    try {
      const result = await actor.create_challenge(request);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取挑战详情
   */
  async getChallenge(id: number): Promise<ApiResponse<Challenge>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_challenge(BigInt(id));
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 列出挑战
   */
  async listChallenges(
    status?: ChallengeStatus, 
    offset: number = 0, 
    limit: number = 10
  ): Promise<ApiResponse<Challenge[]>> {
    const actor = this.getActor();
    try {
      const statusOpt: [] | [ChallengeStatus] = status ? [status] : [];
      const result = await actor.list_challenges(statusOpt, BigInt(offset), BigInt(limit));
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 更新挑战状态
   */
  async updateChallengeStatus(id: number, status: ChallengeStatus): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.update_challenge_status(BigInt(id), status);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 部署目标 canister
   */
  async deployTargetCanister(challengeId: number): Promise<ApiResponse<Principal>> {
    const actor = this.getActor();
    try {
      const result = await actor.deploy_target_canister(BigInt(challengeId));
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 过期挑战
   */
  async expireChallenge(id: number): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.expire_challenge(BigInt(id));
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取挑战统计
   */
  async getChallengeStats(): Promise<ApiResponse<ChallengeStats>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_challenge_stats();
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取公司的挑战
   */
  async getCompanyChallenges(company: Principal): Promise<ApiResponse<Challenge[]>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_company_challenges(company);
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 添加管理员
   */
  async addAdmin(admin: Principal): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.add_admin(admin);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 移除管理员
   */
  async removeAdmin(admin: Principal): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.remove_admin(admin);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取管理员列表
   */
  async getAdmins(): Promise<ApiResponse<Principal[]>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_admins();
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ===== Vault 模块方法 =====

  /**
   * 存款
   */
  async deposit(tokenType: TokenType, amount: number): Promise<ApiResponse<bigint>> {
    const actor = this.getActor();
    try {
      const result = await actor.deposit(tokenType, BigInt(amount));
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 锁定资金
   */
  async lockFunds(request: LockRequest): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.lock_funds(request);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 解锁资金
   */
  async unlockFunds(request: UnlockRequest): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.unlock_funds(request);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取余额
   */
  async getBalance(user: Principal, tokenType: TokenType): Promise<ApiResponse<Balance>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_balance(user, tokenType);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取锁定信息
   */
  async getLockInfo(challengeId: number): Promise<ApiResponse<any>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_lock_info(BigInt(challengeId));
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(
    user: Principal, 
    offset: number = 0, 
    limit: number = 10
  ): Promise<ApiResponse<Transaction[]>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_transaction_history(user, BigInt(offset), BigInt(limit));
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取 Vault 统计
   */
  async getVaultStats(): Promise<ApiResponse<VaultStats>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_vault_stats();
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 添加授权 canister
   */
  async addAuthorizedCanister(canister: Principal): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.add_authorized_canister(canister);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取授权 canister 列表
   */
  async getAuthorizedCanisters(): Promise<ApiResponse<Principal[]>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_authorized_canisters();
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 设置暂停状态
   */
  async setPauseStatus(paused: boolean): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.set_pause_status(paused);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 检查是否暂停
   */
  async isPaused(): Promise<ApiResponse<boolean>> {
    const actor = this.getActor();
    try {
      const result = await actor.is_paused();
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 设置平台费用接收者
   */
  async setPlatformFeeRecipient(recipient: Principal): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.set_platform_fee_recipient(recipient);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ===== Judge 模块方法 =====

  /**
   * 开始监控
   */
  async startMonitoring(challengeId: number, targetCanister: Principal): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.start_monitoring(BigInt(challengeId), targetCanister);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 停止监控
   */
  async stopMonitoring(challengeId: number): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.stop_monitoring(BigInt(challengeId));
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 评估攻击
   */
  async evaluateAttack(challengeId: number, attempt: AttackAttempt): Promise<ApiResponse<Evaluation>> {
    const actor = this.getActor();
    try {
      const result = await actor.evaluate_attack(BigInt(challengeId), attempt);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 创建争议
   */
  async createDispute(
    challengeId: number,
    attemptId: number,
    reason: string,
    evidence: Uint8Array[]
  ): Promise<ApiResponse<bigint>> {
    const actor = this.getActor();
    try {
      const result = await actor.create_dispute(
        BigInt(challengeId),
        BigInt(attemptId),
        reason,
        evidence
      );
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 解决争议
   */
  async resolveDispute(
    disputeId: number,
    decision: any,
    reasoning: string
  ): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.resolve_dispute(BigInt(disputeId), decision, reasoning);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取监控状态
   */
  async getMonitoringState(challengeId: number): Promise<ApiResponse<MonitoringState>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_monitoring_state(BigInt(challengeId));
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取评估记录
   */
  async getEvaluations(challengeId: number): Promise<ApiResponse<Evaluation[]>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_evaluations(BigInt(challengeId));
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取余额历史
   */
  async getBalanceHistory(
    canisterId: Principal, 
    limit: number = 50
  ): Promise<ApiResponse<BalanceSnapshot[]>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_balance_history(canisterId, BigInt(limit));
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取开放争议
   */
  async getOpenDisputes(): Promise<ApiResponse<DisputeCase[]>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_open_disputes();
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 设置 BountyFactory canister
   */
  async setBountyFactory(canister: Principal): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.set_bounty_factory(canister);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 设置 Vault canister
   */
  async setVaultCanister(canister: Principal): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.set_vault_canister(canister);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ===== Leaderboard 模块方法 =====

  /**
   * 注册用户
   */
  async registerUser(role: UserRole): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.register_user(role);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 设置显示名称
   */
  async setDisplayName(name: string): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.set_display_name(name);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 记录成功攻击
   */
  async recordSuccessfulAttack(
    hacker: Principal,
    challengeId: number,
    bountyAmount: number,
    tokenType: TokenType
  ): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.record_successful_attack(
        hacker,
        BigInt(challengeId),
        BigInt(bountyAmount),
        tokenType
      );
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 记录挑战创建
   */
  async recordChallengeCreation(
    company: Principal,
    challengeId: number,
    tokenType: TokenType
  ): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.record_challenge_creation(
        company,
        BigInt(challengeId),
        tokenType
      );
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取黑客排行榜
   */
  async getHackerLeaderboard(limit: number = 20): Promise<ApiResponse<LeaderboardEntry[]>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_hacker_leaderboard(BigInt(limit));
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取公司排行榜
   */
  async getCompanyLeaderboard(limit: number = 20): Promise<ApiResponse<CompanyLeaderboardEntry[]>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_company_leaderboard(BigInt(limit));
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取用户资料
   */
  async getUserProfile(user: Principal): Promise<ApiResponse<any>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_user_profile(user);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取平台统计
   */
  async getPlatformStats(): Promise<ApiResponse<PlatformStats>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_platform_stats();
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取用户统计
   */
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    const actor = this.getActor();
    try {
      const result = await actor.get_user_stats();
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 设置 BountyFactory canister（用于排行榜）
   */
  async setBountyFactoryForLeaderboard(canister: Principal): Promise<ApiResponse<void>> {
    const actor = this.getActor();
    try {
      const result = await actor.set_bounty_factory_for_leaderboard(canister);
      return this.handleResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ===== 工具方法 =====

  /**
   * 处理 API 响应结果
   */
  private handleResult<T>(result: any): ApiResponse<T> {
    if ('Ok' in result) {
      return { success: true, data: result.Ok };
    } else if ('Err' in result) {
      return { success: false, error: this.formatError(result.Err) };
    } else {
      // 直接返回结果（对于没有包装的方法）
      return { success: true, data: result };
    }
  }

  /**
   * 处理错误
   */
  private handleError(error: any): ApiResponse<any> {
    console.error('ZeroLock Backend Service Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }

  /**
   * 格式化错误信息
   */
  private formatError(error: ZeroLockError): string {
    if ('NotFound' in error) return error.NotFound;
    if ('Unauthorized' in error) return error.Unauthorized;
    if ('InvalidInput' in error) return error.InvalidInput;
    if ('InternalError' in error) return error.InternalError;
    if ('ResourceLimit' in error) return error.ResourceLimit;
    if ('InvalidState' in error) return error.InvalidState;
    if ('InsufficientFunds' in error) return error.InsufficientFunds;
    if ('NetworkError' in error) return error.NetworkError;
    if ('AlreadyExists' in error) return error.AlreadyExists;
    return 'Unknown error';
  }

  /**
   * 重新初始化服务（当用户登录状态改变时）
   */
  async reinitialize(identity: Identity): Promise<void> {
    this.identity = identity;
    await this.initialize();
  }

  /**
   * 清理服务
   */
  cleanup(): void {
    this.actor = null;
    this.agent = null;
    this.identity = null;
  }
}

// 全局服务实例
let globalBackendService: ZeroLockBackendService | null = null;

/**
 * 获取全局 Backend Service 实例
 */
export const getBackendService = (): ZeroLockBackendService => {
  if (!globalBackendService) {
    globalBackendService = new ZeroLockBackendService();
  }
  return globalBackendService;
};

/**
 * 初始化全局服务
 */
export const initializeBackendService = async (identity?: Identity): Promise<void> => {
  const service = getBackendService();
  await service.initialize(identity);
};

// 导出类型以供前端使用
export type {
  Challenge,
  ChallengeStatus,
  TokenType,
  UserRole,
  Transaction,
  Balance,
  UserProfile,
  AttackAttempt,
  CreateChallengeRequest,
  LockRequest,
  UnlockRequest,
  PlatformStats,
  UserStats,
  ChallengeStats,
  VaultStats,
  LeaderboardEntry,
  CompanyLeaderboardEntry,
  Evaluation,
  DisputeCase,
  BalanceSnapshot,
  MonitoringState,
  ZeroLockError
};

// 定义前端 API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
