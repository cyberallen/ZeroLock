import { useState, useEffect, useCallback } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { createAuthClient, getInternetIdentityUrl } from '@/services/agent';
import { AuthState, WalletType } from '@/types';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    principal: null,
    wallet: null,
    userType: null,
  });
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化认证客户端
  useEffect(() => {
    const initAuth = async () => {
      try {
        const client = await createAuthClient();
        setAuthClient(client);

        // 检查是否已经认证
        const isAuthenticated = await client.isAuthenticated();
        if (isAuthenticated) {
          const identity = client.getIdentity();
          const principal = identity.getPrincipal();
          
          setAuthState({
            isAuthenticated: true,
            principal,
            wallet: {
              principal,
              accountId: principal.toString(),
              balance: 0, // TODO: 获取实际余额
              isConnected: true,
            },
            userType: null, // TODO: 从后端获取用户类型
          });
        }
      } catch (error) {
        console.error('Failed to initialize auth client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Internet Identity 登录
  const loginWithInternetIdentity = useCallback(async (): Promise<boolean> => {
    if (!authClient) {
      throw new Error('Auth client not initialized');
    }

    try {
      setIsLoading(true);
      
      await new Promise<void>((resolve, reject) => {
        authClient.login({
          identityProvider: getInternetIdentityUrl(),
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
          windowOpenerFeatures: 'toolbar=0,location=0,menubar=0,width=500,height=500,left=100,top=100',
        });
      });

      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal();
      
      setAuthState({
        isAuthenticated: true,
        principal,
        wallet: {
          principal,
          accountId: principal.toString(),
          balance: 0, // TODO: 获取实际余额
          isConnected: true,
        },
        userType: null, // TODO: 从后端获取用户类型
      });

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  // Plug钱包登录
  const loginWithPlug = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // 检查Plug钱包是否可用
      if (!window.ic?.plug) {
        throw new Error('Plug wallet not installed');
      }

      // 请求连接
      const connected = await window.ic.plug.requestConnect({
        whitelist: [
          // TODO: 添加实际的canister IDs
        ],
        host: 'https://ic0.app',
      });

      if (!connected) {
        throw new Error('User rejected connection');
      }

      const principal = await window.ic.plug.getPrincipal();
      const balance = await window.ic.plug.requestBalance();
      
      setAuthState({
        isAuthenticated: true,
        principal,
        wallet: {
          principal,
          accountId: principal.toString(),
          balance: balance[0]?.amount || 0,
          isConnected: true,
        },
        userType: null, // TODO: 从后端获取用户类型
      });

      return true;
    } catch (error) {
      console.error('Plug login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登录
  const login = useCallback(async (walletType: WalletType): Promise<boolean> => {
    switch (walletType) {
      case 'InternetIdentity':
        return await loginWithInternetIdentity();
      case 'Plug':
        return await loginWithPlug();
      case 'Stoic':
        // TODO: 实现Stoic钱包登录
        throw new Error('Stoic wallet not implemented yet');
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  }, [loginWithInternetIdentity, loginWithPlug]);

  // 登出
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      if (authClient) {
        await authClient.logout();
      }
      
      // 如果使用Plug钱包，也要断开连接
      if (window.ic?.plug) {
        await window.ic.plug.disconnect();
      }
      
      setAuthState({
        isAuthenticated: false,
        principal: null,
        wallet: null,
        userType: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  // 获取身份
  const getIdentity = useCallback((): Identity | null => {
    return authClient?.getIdentity() || null;
  }, [authClient]);

  // 更新用户类型
  const setUserType = useCallback((userType: 'hacker' | 'company' | null) => {
    setAuthState(prev => ({ ...prev, userType }));
  }, []);

  return {
    ...authState,
    isLoading,
    login,
    logout,
    getIdentity,
    setUserType,
  };
};

// 扩展Window接口以支持Plug钱包
declare global {
  interface Window {
    ic?: {
      plug?: {
        requestConnect: (options: any) => Promise<boolean>;
        getPrincipal: () => Promise<Principal>;
        requestBalance: () => Promise<any[]>;
        disconnect: () => Promise<void>;
        createActor: (options: any) => any;
      };
    };
  }
}