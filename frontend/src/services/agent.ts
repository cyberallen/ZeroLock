import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { getEnvConfig, isLocalNetwork } from '@/utils/env';

const config = getEnvConfig();

// 创建HTTP Agent
export const createAgent = async (identity?: Identity): Promise<HttpAgent> => {
  const agent = new HttpAgent({
    host: config.IC_HOST,
    identity,
  });

  // 在本地开发环境中获取根密钥
  if (isLocalNetwork()) {
    try {
      await agent.fetchRootKey();
    } catch (error) {
      console.warn('Failed to fetch root key:', error);
    }
  }

  return agent;
};

// 创建Canister Actor
export const createActor = <T>(
  canisterId: string,
  idl: any,
  agent: HttpAgent
): T => {
  return Actor.createActor<T>(idl, {
    agent,
    canisterId,
  });
};

// 创建认证客户端
export const createAuthClient = async (): Promise<AuthClient> => {
  return await AuthClient.create({
    idleOptions: {
      idleTimeout: 1000 * 60 * 30, // 30分钟
      disableDefaultIdleCallback: true,
    },
  });
};

// 获取Internet Identity登录URL
export const getInternetIdentityUrl = (): string => {
  if (isLocalNetwork()) {
    return `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID || 'rdmx6-jaaaa-aaaaa-aaadq-cai'}`;
  }
  return config.INTERNET_IDENTITY_URL;
};

// Principal工具函数
export const principalToString = (principal: Principal): string => {
  return principal.toString();
};

export const stringToPrincipal = (str: string): Principal => {
  return Principal.fromText(str);
};

// 验证Principal格式
export const isValidPrincipal = (str: string): boolean => {
  try {
    Principal.fromText(str);
    return true;
  } catch {
    return false;
  }
};

// 格式化Principal显示
export const formatPrincipal = (principal: Principal | string, length = 8): string => {
  const str = typeof principal === 'string' ? principal : principal.toString();
  if (str.length <= length * 2) return str;
  return `${str.slice(0, length)}...${str.slice(-length)}`;
};

// 错误处理
export const handleAgentError = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};