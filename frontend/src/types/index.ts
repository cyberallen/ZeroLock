import { Principal } from '@dfinity/principal';

// 基础类型
export interface Challenge {
  id: number;
  title: string;
  company: string;
  bounty: number;
  tokenType: 'ICP' | 'ICRC1';
  timeRemaining: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Active' | 'Completed' | 'Expired';
  description: string;
  participantCount: number;
  createdAt: number;
  expiresAt: number;
}

export interface ChallengeDetail extends Challenge {
  contractCode: string;
  candidInterface: string;
  currentBalance: number;
  initialBalance: number;
  attackHistory: AttackAttempt[];
  contractLanguage: 'Motoko' | 'Rust';
  creator: Principal;
  canisterId: string;
  companyLogo: string;
  successfulHacks: number;
  requirements: string[];
  rules: string[];
  recentAttempts: AttackAttempt[];
  targetContract: string;
  sourceCode: string;
  documentation: string;
  testnetUrl: string;
  submissionCount: number;
}

export interface AttackAttempt {
  id: string;
  attacker: string;
  timestamp: number;
  method: string;
  success: boolean;
  gasUsed: number;
  balanceChange?: number;
  status: 'pending' | 'approved' | 'rejected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  challengeTitle: string;
  description: string;
  submittedAt: number;
  reward: number;
  feedback?: string;
  hackerNickname: string;
}

export interface HackerRank {
  rank: number;
  principal: string;
  nickname: string;
  successCount: number;
  totalEarnings: number;
  reputation: number;
  avatar?: string;
}

export interface HackerProfile {
  principal: string;
  nickname: string;
  avatar: string;
  reputation: number;
  level: number;
  totalEarnings: number;
  successfulHacks: number;
  participatedChallenges: number;
  specialties: string[];
  achievements: Achievement[];
  joinedAt: number;
  totalAttempts: number;
  rank: number;
  skills: string[];
  bio: string;
  socialLinks: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  unlockedAt: number;
  progress: number;
}

export interface CompanyProfile {
  principal: string;
  name: string;
  logo: string;
  description: string;
  website: string;
  totalChallenges: number;
  activeChallenges: number;
  totalBountyPaid: number;
  successfulHacks: number;
  averageTimeToHack: number;
  joinedAt: number;
  industry: string;
  completedChallenges: number;
  securityScore: number;
  reputation: number;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  averageResolutionTime: number;
  teamSize: number;
  foundedYear: number;
  location: string;
  socialLinks: {
    website?: string;
    twitter?: string;
    linkedin?: string;
  };
}

// 表单类型
export interface ChallengeForm {
  title: string;
  description: string;
  contractFile: File | null;
  candidFile: File | null;
  bountyAmount: number;
  tokenType: 'ICP' | 'ICRC1';
  duration: number;
  difficultyLevel: number;
}

export interface AttackForm {
  method: string;
  parameters: string;
  gasLimit: number;
}

// 统计类型
export interface CompanyStats {
  totalChallenges: number;
  activeChallenges: number;
  totalBountyPaid: number;
  successfulHacks: number;
  averageTimeToHack: number;
}

export interface PlatformStats {
  totalChallenges: number;
  totalHackers: number;
  totalCompanies: number;
  totalBountyPaid: number;
  averageSuccessRate: number;
}

// 钱包和认证类型
export interface WalletInfo {
  principal: Principal;
  accountId: string;
  balance: number;
  isConnected: boolean;
}

export type WalletType = 'InternetIdentity' | 'Plug' | 'Stoic';

export interface AuthState {
  isAuthenticated: boolean;
  principal: Principal | null;
  wallet: WalletInfo | null;
  userType: 'hacker' | 'company' | null;
}

// 过滤和搜索类型
export interface ChallengeFilters {
  status?: Challenge['status'][];
  difficulty?: Challenge['difficulty'][];
  tokenType?: Challenge['tokenType'][];
  bountyRange?: [number, number];
  search?: string;
  sortBy?: 'bounty' | 'timeRemaining' | 'createdAt' | 'participantCount';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

// 交易类型
export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bounty_payment' | 'attack_reward';
  amount: number;
  tokenType: 'ICP' | 'ICRC1';
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  from?: string;
  to?: string;
  challengeId?: number;
}

// 监控和余额类型
export interface BalanceSnapshot {
  timestamp: number;
  balance: number;
  blockHeight: number;
}

export interface MonitoringState {
  challengeId: number;
  isActive: boolean;
  startTime: number;
  lastCheck: number;
  balanceHistory: BalanceSnapshot[];
}

// 争议类型
export interface DisputeCase {
  id: string;
  challengeId: number;
  attacker: Principal;
  company: Principal;
  reason: string;
  evidence: string[];
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  createdAt: number;
  resolvedAt?: number;
  resolution?: string;
}

// 环境变量类型
export interface EnvConfig {
  IC_HOST: string;
  DFX_NETWORK: string;
  BOUNTY_FACTORY_CANISTER_ID: string;
  VAULT_CANISTER_ID: string;
  JUDGE_CANISTER_ID: string;
  LEADERBOARD_CANISTER_ID: string;
  INTERNET_IDENTITY_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
}