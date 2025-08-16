import { Principal } from '@dfinity/principal';
import { ZeroLockBackendService, ApiResponse } from './backend';
import type {
  Challenge,
  ChallengeStatus,
  CreateChallengeRequest,
  ChallengeStats
} from '../declarations/backend/backend.did';

/**
 * BountyFactory 服务类
 * 专门处理挑战相关的操作
 */
export class BountyFactoryService {
  constructor(private backendService: ZeroLockBackendService) {}

  /**
   * 创建新挑战
   */
  async createChallenge(request: CreateChallengeRequest): Promise<ApiResponse<bigint>> {
    return this.backendService.createChallenge(request);
  }

  /**
   * 获取挑战详情
   */
  async getChallenge(id: number): Promise<ApiResponse<Challenge>> {
    return this.backendService.getChallenge(id);
  }

  /**
   * 列出挑战
   */
  async listChallenges(
    status?: ChallengeStatus,
    offset: number = 0,
    limit: number = 10
  ): Promise<ApiResponse<Challenge[]>> {
    return this.backendService.listChallenges(status, offset, limit);
  }

  /**
   * 获取所有挑战（不分页，适用于下拉选择等场景）
   */
  async getAllChallenges(status?: ChallengeStatus): Promise<ApiResponse<Challenge[]>> {
    const allChallenges: Challenge[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await this.listChallenges(status, offset, limit);
      
      if (!response.success) {
        return response;
      }

      const challenges = response.data || [];
      allChallenges.push(...challenges);
      
      hasMore = challenges.length === limit;
      offset += limit;
    }

    return { success: true, data: allChallenges };
  }

  /**
   * 更新挑战状态
   */
  async updateChallengeStatus(id: number, status: ChallengeStatus): Promise<ApiResponse<void>> {
    return this.backendService.updateChallengeStatus(id, status);
  }

  /**
   * 部署目标 canister
   */
  async deployTargetCanister(challengeId: number): Promise<ApiResponse<Principal>> {
    return this.backendService.deployTargetCanister(challengeId);
  }

  /**
   * 过期挑战
   */
  async expireChallenge(id: number): Promise<ApiResponse<void>> {
    return this.backendService.expireChallenge(id);
  }

  /**
   * 批量操作：更新多个挑战状态
   */
  async batchUpdateChallengeStatus(
    updates: Array<{ id: number; status: ChallengeStatus }>
  ): Promise<ApiResponse<{ successful: number; failed: number; errors: string[] }>> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const update of updates) {
      try {
        const response = await this.updateChallengeStatus(update.id, update.status);
        if (response.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push(`Challenge ${update.id}: ${response.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Challenge ${update.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success: true, data: results };
  }

  /**
   * 获取挑战统计
   */
  async getChallengeStats(): Promise<ApiResponse<ChallengeStats>> {
    return this.backendService.getChallengeStats();
  }

  /**
   * 获取公司的挑战
   */
  async getCompanyChallenges(company: Principal): Promise<ApiResponse<Challenge[]>> {
    return this.backendService.getCompanyChallenges(company);
  }

  /**
   * 获取活跃挑战（状态为 Active 的挑战）
   */
  async getActiveChallenges(): Promise<ApiResponse<Challenge[]>> {
    return this.listChallenges({ 'Active': null }, 0, 100);
  }

  /**
   * 获取已完成挑战（状态为 Completed 的挑战）
   */
  async getCompletedChallenges(): Promise<ApiResponse<Challenge[]>> {
    return this.listChallenges({ 'Completed': null }, 0, 100);
  }

  /**
   * 搜索挑战（基于描述）
   */
  async searchChallenges(
    query: string, 
    status?: ChallengeStatus
  ): Promise<ApiResponse<Challenge[]>> {
    // 获取所有挑战然后在客户端过滤
    // TODO: 后端支持搜索功能后可以直接调用后端搜索
    const response = await this.getAllChallenges(status);
    
    if (!response.success) {
      return response;
    }

    const challenges = response.data || [];
    const filteredChallenges = challenges.filter(challenge => 
      challenge.description.toLowerCase().includes(query.toLowerCase())
    );

    return { success: true, data: filteredChallenges };
  }

  // 管理员功能

  /**
   * 添加管理员
   */
  async addAdmin(admin: Principal): Promise<ApiResponse<void>> {
    return this.backendService.addAdmin(admin);
  }

  /**
   * 移除管理员
   */
  async removeAdmin(admin: Principal): Promise<ApiResponse<void>> {
    return this.backendService.removeAdmin(admin);
  }

  /**
   * 获取管理员列表
   */
  async getAdmins(): Promise<ApiResponse<Principal[]>> {
    return this.backendService.getAdmins();
  }

  /**
   * 检查是否为管理员
   */
  async isAdmin(principal: Principal): Promise<ApiResponse<boolean>> {
    const response = await this.getAdmins();
    
    if (!response.success) {
      return { success: false, error: response.error };
    }

    const admins = response.data || [];
    const isAdminUser = admins.some(admin => admin.toText() === principal.toText());
    
    return { success: true, data: isAdminUser };
  }
}
