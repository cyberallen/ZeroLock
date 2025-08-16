/**
 * ZeroLock Frontend Services
 * 统一导出所有服务类和相关工具
 */

import { ZeroLockBackendService, getBackendService } from './backend';
import { BountyFactoryService } from './bountyFactory';
import { VaultService } from './vault';

// 主要服务类
export { ZeroLockBackendService, getBackendService, initializeBackendService } from './backend';
export { BountyFactoryService } from './bountyFactory';
export { VaultService } from './vault';

// 服务管理 hooks
export {
  useBackendService,
  useApiCall,
  useAutoApiCall,
  usePaginatedData
} from '../hooks/useBackendService';

// 错误处理工具
export {
  isApiSuccess,
  isApiError,
  extractApiData,
  getApiDataSafe,
  formatErrorMessage,
  showErrorNotification,
  showSuccessNotification,
  withErrorHandling,
  validatePaginationParams,
  safeBigIntToNumber,
  formatPrincipal,
  isAuthenticated
} from '../utils/error-handler';

// 重新导出类型
export type {
  ApiResponse,
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
} from './backend';

// Hook 类型
export type {
  UseBackendServiceReturn,
  UseApiCallOptions,
  UseApiCallReturn,
  UsePaginatedDataOptions,
  UsePaginatedDataReturn
} from '../hooks/useBackendService';

/**
 * 创建完整的服务实例集合
 */
export interface ServiceContainer {
  backend: ZeroLockBackendService;
  bountyFactory: BountyFactoryService;
  vault: VaultService;
  // TODO: 添加其他服务
  // judge: JudgeService;
  // leaderboard: LeaderboardService;
}

/**
 * 服务容器单例
 */
let serviceContainer: ServiceContainer | null = null;

/**
 * 获取服务容器
 * @param backend 可选的后端服务实例，如果不提供则使用全局实例
 * @returns 包含所有服务的容器
 */
export const getServiceContainer = (backend?: ZeroLockBackendService): ServiceContainer => {
  if (!serviceContainer || backend) {
    const backendService = backend || getBackendService();
    
    serviceContainer = {
      backend: backendService,
      bountyFactory: new BountyFactoryService(backendService),
      vault: new VaultService(backendService),
    };
  }
  
  return serviceContainer;
};

/**
 * 清理服务容器
 */
export const cleanupServiceContainer = (): void => {
  if (serviceContainer) {
    serviceContainer.backend.cleanup();
    serviceContainer = null;
  }
};

/**
 * 重新初始化所有服务
 */
export const reinitializeServices = async (identity: any): Promise<void> => {
  if (serviceContainer) {
    await serviceContainer.backend.reinitialize(identity);
    // 重新创建服务实例以确保使用新的后端服务
    serviceContainer = {
      backend: serviceContainer.backend,
      bountyFactory: new BountyFactoryService(serviceContainer.backend),
      vault: new VaultService(serviceContainer.backend),
    };
  }
};

// 便捷访问器
export const getBountyFactoryService = (): BountyFactoryService => {
  return getServiceContainer().bountyFactory;
};

export const getVaultService = (): VaultService => {
  return getServiceContainer().vault;
};

// 统一错误类型
export interface ServiceError {
  service: string;
  method: string;
  error: string;
  timestamp: Date;
}

/**
 * 统一的服务错误处理器
 */
export const handleServiceError = (
  serviceName: string,
  methodName: string,
  error: unknown
): ServiceError => {
  const serviceError: ServiceError = {
    service: serviceName,
    method: methodName,
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date()
  };
  
  console.error('Service Error:', serviceError);
  return serviceError;
};
