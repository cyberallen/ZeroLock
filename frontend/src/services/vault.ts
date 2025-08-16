import { Principal } from '@dfinity/principal';
import { ZeroLockBackendService, ApiResponse } from './backend';
import type {
  TokenType,
  Balance,
  Transaction,
  LockRequest,
  UnlockRequest,
  VaultStats
} from '../declarations/backend/backend.did';

/**
 * Vault 服务类
 * 专门处理资金管理相关的操作
 */
export class VaultService {
  constructor(private backendService: ZeroLockBackendService) {}

  /**
   * 存款
   */
  async deposit(tokenType: TokenType, amount: number): Promise<ApiResponse<bigint>> {
    if (amount <= 0) {
      return { success: false, error: 'Deposit amount must be positive' };
    }
    
    return this.backendService.deposit(tokenType, amount);
  }

  /**
   * 锁定资金
   */
  async lockFunds(request: LockRequest): Promise<ApiResponse<void>> {
    return this.backendService.lockFunds(request);
  }

  /**
   * 解锁资金
   */
  async unlockFunds(request: UnlockRequest): Promise<ApiResponse<void>> {
    return this.backendService.unlockFunds(request);
  }

  /**
   * 获取用户余额
   */
  async getBalance(user: Principal, tokenType: TokenType): Promise<ApiResponse<Balance>> {
    return this.backendService.getBalance(user, tokenType);
  }

  /**
   * 获取所有代币的余额
   */
  async getAllBalances(user: Principal): Promise<ApiResponse<Balance[]>> {
    const tokenTypes: TokenType[] = [
      { 'ICP': null }
      // TODO: 添加 ICRC1 代币支持时需要指定具体的 Principal
      // { 'ICRC1': Principal.fromText('canister-id') }
    ];

    const balances: Balance[] = [];
    const errors: string[] = [];

    for (const tokenType of tokenTypes) {
      try {
        const response = await this.getBalance(user, tokenType);
        if (response.success && response.data) {
          balances.push(response.data);
        } else {
          errors.push(`Failed to get ${JSON.stringify(tokenType)} balance: ${response.error}`);
        }
      } catch (error) {
        errors.push(`Error getting ${JSON.stringify(tokenType)} balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (balances.length === 0) {
      return { success: false, error: `Failed to get any balances: ${errors.join(', ')}` };
    }

    return { success: true, data: balances };
  }

  /**
   * 获取锁定信息
   */
  async getLockInfo(challengeId: number): Promise<ApiResponse<any>> {
    return this.backendService.getLockInfo(challengeId);
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(
    user: Principal,
    offset: number = 0,
    limit: number = 10
  ): Promise<ApiResponse<Transaction[]>> {
    if (offset < 0) {
      return { success: false, error: 'Offset must be non-negative' };
    }
    
    if (limit <= 0 || limit > 100) {
      return { success: false, error: 'Limit must be between 1 and 100' };
    }

    return this.backendService.getTransactionHistory(user, offset, limit);
  }

  /**
   * 获取完整交易历史（所有页面）
   */
  async getFullTransactionHistory(user: Principal): Promise<ApiResponse<Transaction[]>> {
    const allTransactions: Transaction[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getTransactionHistory(user, offset, limit);
      
      if (!response.success) {
        if (offset === 0) {
          // 第一页就失败，返回错误
          return response;
        }
        // 后续页面失败，返回已获取的数据
        break;
      }

      const transactions = response.data || [];
      allTransactions.push(...transactions);
      
      hasMore = transactions.length === limit;
      offset += limit;

      // 防止无限循环，最多获取 1000 条交易记录
      if (allTransactions.length >= 1000) {
        break;
      }
    }

    return { success: true, data: allTransactions };
  }

  /**
   * 获取 Vault 统计信息
   */
  async getVaultStats(): Promise<ApiResponse<VaultStats>> {
    return this.backendService.getVaultStats();
  }

  /**
   * 检查是否有足够的可用余额
   */
  async hasAvailableBalance(
    user: Principal,
    tokenType: TokenType,
    requiredAmount: number
  ): Promise<ApiResponse<boolean>> {
    const response = await this.getBalance(user, tokenType);
    
    if (!response.success) {
      return { success: false, error: response.error };
    }

    const balance = response.data;
    if (!balance) {
      return { success: false, error: 'No balance data received' };
    }

    const availableAmount = Number(balance.available);
    const hasEnough = availableAmount >= requiredAmount;
    
    return { success: true, data: hasEnough };
  }

  /**
   * 获取可用余额数量
   */
  async getAvailableBalance(
    user: Principal,
    tokenType: TokenType
  ): Promise<ApiResponse<number>> {
    const response = await this.getBalance(user, tokenType);
    
    if (!response.success) {
      return { success: false, error: response.error };
    }

    const balance = response.data;
    if (!balance) {
      return { success: false, error: 'No balance data received' };
    }

    const availableAmount = Number(balance.available);
    return { success: true, data: availableAmount };
  }

  /**
   * 计算总锁定金额
   */
  async getTotalLockedAmount(user: Principal): Promise<ApiResponse<{ ICP: number; ICRC1: number }>> {
    const response = await this.getAllBalances(user);
    
    if (!response.success) {
      return { success: false, error: response.error };
    }

    const balances = response.data || [];
    const totals = { ICP: 0, ICRC1: 0 };

    for (const balance of balances) {
      const lockedAmount = Number(balance.locked);
      if ('ICP' in balance.token_type) {
        totals.ICP += lockedAmount;
      } else if ('ICRC1' in balance.token_type) {
        totals.ICRC1 += lockedAmount;
      }
    }

    return { success: true, data: totals };
  }

  // 管理员功能

  /**
   * 添加授权 canister
   */
  async addAuthorizedCanister(canister: Principal): Promise<ApiResponse<void>> {
    return this.backendService.addAuthorizedCanister(canister);
  }

  /**
   * 获取授权 canister 列表
   */
  async getAuthorizedCanisters(): Promise<ApiResponse<Principal[]>> {
    return this.backendService.getAuthorizedCanisters();
  }

  /**
   * 设置暂停状态
   */
  async setPauseStatus(paused: boolean): Promise<ApiResponse<void>> {
    return this.backendService.setPauseStatus(paused);
  }

  /**
   * 检查是否暂停
   */
  async isPaused(): Promise<ApiResponse<boolean>> {
    return this.backendService.isPaused();
  }

  /**
   * 设置平台费用接收者
   */
  async setPlatformFeeRecipient(recipient: Principal): Promise<ApiResponse<void>> {
    return this.backendService.setPlatformFeeRecipient(recipient);
  }

  /**
   * 检查 canister 是否被授权
   */
  async isCanisterAuthorized(canister: Principal): Promise<ApiResponse<boolean>> {
    const response = await this.getAuthorizedCanisters();
    
    if (!response.success) {
      return { success: false, error: response.error };
    }

    const authorizedCanisters = response.data || [];
    const isAuthorized = authorizedCanisters.some(
      authCanister => authCanister.toText() === canister.toText()
    );
    
    return { success: true, data: isAuthorized };
  }

  /**
   * 批量检查多个用户的余额
   */
  async batchGetBalances(
    users: Principal[],
    tokenType: TokenType
  ): Promise<ApiResponse<Array<{ user: Principal; balance: Balance | null; error?: string }>>> {
    const results = [];

    for (const user of users) {
      try {
        const response = await this.getBalance(user, tokenType);
        if (response.success && response.data) {
          results.push({ user, balance: response.data });
        } else {
          results.push({ user, balance: null, error: response.error });
        }
      } catch (error) {
        results.push({
          user,
          balance: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { success: true, data: results };
  }
}
