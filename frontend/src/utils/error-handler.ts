import { ApiResponse } from '@/services/backend';

/**
 * 检查 API 响应是否成功
 */
export const isApiSuccess = <T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } => {
  return response.success === true && response.data !== undefined;
};

/**
 * 检查 API 响应是否失败
 */
export const isApiError = <T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: false; error: string } => {
  return response.success === false && response.error !== undefined;
};

/**
 * 从 API 响应中提取数据，如果失败则抛出错误
 */
export const extractApiData = <T>(response: ApiResponse<T>): T => {
  if (isApiSuccess(response)) {
    return response.data;
  }
  throw new Error(response.error || 'API request failed');
};

/**
 * 安全地从 API 响应中获取数据，失败时返回默认值
 */
export const getApiDataSafe = <T>(response: ApiResponse<T>, defaultValue: T): T => {
  if (isApiSuccess(response)) {
    return response.data;
  }
  return defaultValue;
};

/**
 * 格式化错误信息为用户友好的消息
 */
export const formatErrorMessage = (error: string | unknown): string => {
  if (typeof error === 'string') {
    // 处理常见的错误类型
    const errorMappings: Record<string, string> = {
      'NotFound': '未找到请求的资源',
      'Unauthorized': '您没有权限执行此操作',
      'InvalidInput': '输入参数无效',
      'InternalError': '服务器内部错误',
      'ResourceLimit': '资源限制',
      'InvalidState': '操作状态无效',
      'InsufficientFunds': '余额不足',
      'NetworkError': '网络连接错误',
      'AlreadyExists': '资源已存在',
      'PaginationError': '分页参数错误',
      'WasmSizeExceeded': 'WASM 文件大小超出限制',
      'TimeRangeError': '时间范围错误',
      'PermissionDenied': '权限被拒绝',
      'RateLimitExceeded': '请求频率超过限制'
    };

    return errorMappings[error] || error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '未知错误';
};

/**
 * 显示错误通知（可以与UI库集成）
 */
export const showErrorNotification = (error: string | unknown): void => {
  const message = formatErrorMessage(error);
  console.error('Error:', message);
  
  // TODO: 集成实际的通知系统（如 toast）
  // toast.error(message);
};

/**
 * 显示成功通知
 */
export const showSuccessNotification = (message: string): void => {
  console.log('Success:', message);
  
  // TODO: 集成实际的通知系统
  // toast.success(message);
};

/**
 * 处理异步操作的错误包装器
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  onError?: (error: unknown) => void
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Error in operation:', error);
      
      if (onError) {
        onError(error);
      } else {
        showErrorNotification(error);
      }
      
      return null;
    }
  };
};

/**
 * 验证分页参数
 */
export const validatePaginationParams = (offset: number, limit: number): void => {
  if (offset < 0) {
    throw new Error('Offset must be non-negative');
  }
  
  if (limit <= 0) {
    throw new Error('Limit must be positive');
  }
  
  if (limit > 100) {
    throw new Error('Limit cannot exceed 100');
  }
};

/**
 * 处理 BigInt 数值的安全转换
 */
export const safeBigIntToNumber = (value: bigint, fallback: number = 0): number => {
  try {
    const num = Number(value);
    if (Number.isSafeInteger(num)) {
      return num;
    }
    console.warn('BigInt value too large for safe number conversion:', value);
    return fallback;
  } catch (error) {
    console.error('Error converting BigInt to number:', error);
    return fallback;
  }
};

/**
 * 处理 Principal 类型的显示格式
 */
export const formatPrincipal = (principal: any): string => {
  if (!principal) return 'Anonymous';
  
  if (typeof principal === 'object' && principal.toText) {
    const text = principal.toText();
    // 显示前6位和后4位，中间用省略号
    if (text.length > 15) {
      return `${text.slice(0, 6)}...${text.slice(-4)}`;
    }
    return text;
  }
  
  if (typeof principal === 'string') {
    if (principal.length > 15) {
      return `${principal.slice(0, 6)}...${principal.slice(-4)}`;
    }
    return principal;
  }
  
  return 'Unknown';
};

/**
 * 检查用户是否已认证
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    // TODO: 实现实际的认证检查逻辑
    // 这里应该检查 AuthClient 的状态
    return false;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};
