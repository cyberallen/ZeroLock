import { EnvConfig } from '@/types';

// 获取环境变量配置
export const getEnvConfig = (): EnvConfig => {
  return {
    IC_HOST: import.meta.env.VITE_IC_HOST || 'https://ic0.app',
    DFX_NETWORK: import.meta.env.VITE_DFX_NETWORK || 'local',
    BOUNTY_FACTORY_CANISTER_ID: import.meta.env.VITE_BOUNTY_FACTORY_CANISTER_ID || '',
    VAULT_CANISTER_ID: import.meta.env.VITE_VAULT_CANISTER_ID || '',
    JUDGE_CANISTER_ID: import.meta.env.VITE_JUDGE_CANISTER_ID || '',
    LEADERBOARD_CANISTER_ID: import.meta.env.VITE_LEADERBOARD_CANISTER_ID || '',
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