import { EnvConfig } from '@/types';

// 获取环境变量配置
export const getEnvConfig = (): EnvConfig => {
  // 统一的后端canister ID，所有功能都通过这一个canister提供
  const backendCanisterId = import.meta.env.VITE_ZEROLOCK_BACKEND_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai';
  
  return {
    IC_HOST: import.meta.env.VITE_IC_HOST || 'https://ic0.app',
    DFX_NETWORK: import.meta.env.VITE_DFX_NETWORK || 'local',
    // 所有功能现在都通过统一的后端canister提供
    BOUNTY_FACTORY_CANISTER_ID: backendCanisterId,
    VAULT_CANISTER_ID: backendCanisterId,
    JUDGE_CANISTER_ID: backendCanisterId,
    LEADERBOARD_CANISTER_ID: backendCanisterId,
    INTERNET_IDENTITY_URL: import.meta.env.VITE_INTERNET_IDENTITY_URL || 'https://identity.ic0.app',
    APP_NAME: import.meta.env.VITE_APP_NAME || 'ZeroLock',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  };
};

// 检查是否为开发环境
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

// 检查是否为生产环境
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

// 检查是否为本地网络
export const isLocalNetwork = (): boolean => {
  const config = getEnvConfig();
  return config.DFX_NETWORK === 'local' || config.IC_HOST.includes('localhost');
};