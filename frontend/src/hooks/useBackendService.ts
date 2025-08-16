import { useState, useEffect, useCallback } from 'react';
import { Identity } from '@dfinity/agent';
import { 
  ZeroLockBackendService, 
  getBackendService,
  ApiResponse 
} from '@/services/backend';
import { showErrorNotification } from '@/utils/error-handler';

export interface UseBackendServiceReturn {
  service: ZeroLockBackendService | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: (identity?: Identity) => Promise<void>;
  reinitialize: (identity: Identity) => Promise<void>;
  cleanup: () => void;
}

/**
 * Backend Service Hook
 * 管理 ZeroLock 后端服务的生命周期
 */
export const useBackendService = (): UseBackendServiceReturn => {
  const [service, setService] = useState<ZeroLockBackendService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async (identity?: Identity) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const backendService = getBackendService();
      await backendService.initialize(identity);
      setService(backendService);
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize backend service';
      setError(errorMessage);
      showErrorNotification(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reinitialize = useCallback(async (identity: Identity) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (service) {
        await service.reinitialize(identity);
      } else {
        await initialize(identity);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reinitialize backend service';
      setError(errorMessage);
      showErrorNotification(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, initialize]);

  const cleanup = useCallback(() => {
    if (service) {
      service.cleanup();
    }
    setService(null);
    setIsInitialized(false);
    setError(null);
  }, [service]);

  // 在组件挂载时自动初始化
  useEffect(() => {
    initialize();
    
    return cleanup;
  }, [initialize, cleanup]);

  return {
    service,
    isInitialized,
    isLoading,
    error,
    initialize,
    reinitialize,
    cleanup
  };
};

/**
 * API 调用 Hook
 * 简化 API 调用的状态管理
 */
export interface UseApiCallOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
}

export interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<void>;
  reset: () => void;
}

export const useApiCall = <T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiCallOptions<T> = {}
): UseApiCallReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      
      if (response.success && response.data !== undefined) {
        setData(response.data);
        
        if (options.onSuccess) {
          options.onSuccess(response.data);
        }
      } else {
        const errorMsg = response.error || 'API call failed';
        setError(errorMsg);
        
        if (options.showErrorNotification !== false) {
          showErrorNotification(errorMsg);
        }
        
        if (options.onError) {
          options.onError(errorMsg);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      
      if (options.showErrorNotification !== false) {
        showErrorNotification(errorMsg);
      }
      
      if (options.onError) {
        options.onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

/**
 * 自动执行 API 调用的 Hook
 */
export const useAutoApiCall = <T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: React.DependencyList = [],
  options: UseApiCallOptions<T> = {}
): UseApiCallReturn<T> => {
  const apiCallState = useApiCall(apiCall, options);

  useEffect(() => {
    apiCallState.execute();
  }, dependencies);

  return apiCallState;
};

/**
 * 分页数据管理 Hook
 */
export interface UsePaginatedDataOptions<T> {
  limit?: number;
  onSuccess?: (data: T[], hasMore: boolean) => void;
  onError?: (error: string) => void;
}

export interface UsePaginatedDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentOffset: number;
  loadMore: () => Promise<void>;
  reset: () => void;
  refresh: () => Promise<void>;
}

export const usePaginatedData = <T>(
  apiCall: (offset: number, limit: number) => Promise<ApiResponse<T[]>>,
  options: UsePaginatedDataOptions<T> = {}
): UsePaginatedDataReturn<T> => {
  const { limit = 10 } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (offset: number, append: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall(offset, limit);
      
      if (response.success && response.data !== undefined) {
        const newData = response.data;
        
        if (append) {
          setData(prev => [...prev, ...newData]);
        } else {
          setData(newData);
        }
        
        setCurrentOffset(offset);
        setHasMore(newData.length === limit);
        
        if (options.onSuccess) {
          options.onSuccess(newData, newData.length === limit);
        }
      } else {
        const errorMsg = response.error || 'Failed to load data';
        setError(errorMsg);
        
        if (options.onError) {
          options.onError(errorMsg);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      
      if (options.onError) {
        options.onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, limit, options]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const nextOffset = currentOffset + limit;
    await loadData(nextOffset, true);
  }, [hasMore, loading, currentOffset, limit, loadData]);

  const reset = useCallback(() => {
    setData([]);
    setCurrentOffset(0);
    setHasMore(true);
    setError(null);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    setCurrentOffset(0);
    setHasMore(true);
    await loadData(0, false);
  }, [loadData]);

  // 初始加载
  useEffect(() => {
    loadData(0, false);
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    currentOffset,
    loadMore,
    reset,
    refresh
  };
};
