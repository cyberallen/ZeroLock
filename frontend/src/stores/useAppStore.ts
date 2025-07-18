import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Challenge, HackerProfile, CompanyProfile, Notification, Transaction } from '@/types';

interface AppState {
  // 主题设置
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // 挑战数据
  challenges: Challenge[];
  setChallenges: (challenges: Challenge[]) => void;
  addChallenge: (challenge: Challenge) => void;
  updateChallenge: (id: number, updates: Partial<Challenge>) => void;
  
  // 用户档案
  hackerProfile: HackerProfile | null;
  companyProfile: CompanyProfile | null;
  setHackerProfile: (profile: HackerProfile | null) => void;
  setCompanyProfile: (profile: CompanyProfile | null) => void;
  
  // 通知
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // 交易历史
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  
  // UI状态
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // 加载状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // 错误状态
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // 主题设置
        theme: 'system',
        setTheme: (theme) => {
          set({ theme });
          // 应用主题到DOM
          const root = document.documentElement;
          if (theme === 'dark') {
            root.classList.add('dark');
          } else if (theme === 'light') {
            root.classList.remove('dark');
          } else {
            // 系统主题
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
              root.classList.add('dark');
            } else {
              root.classList.remove('dark');
            }
          }
        },
        
        // 挑战数据
        challenges: [],
        setChallenges: (challenges) => set({ challenges }),
        addChallenge: (challenge) => {
          const { challenges } = get();
          set({ challenges: [challenge, ...challenges] });
        },
        updateChallenge: (id, updates) => {
          const { challenges } = get();
          const updatedChallenges = challenges.map(challenge =>
            challenge.id === id ? { ...challenge, ...updates } : challenge
          );
          set({ challenges: updatedChallenges });
        },
        
        // 用户档案
        hackerProfile: null,
        companyProfile: null,
        setHackerProfile: (profile) => set({ hackerProfile: profile }),
        setCompanyProfile: (profile) => set({ companyProfile: profile }),
        
        // 通知
        notifications: [],
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            read: false,
          };
          const { notifications } = get();
          set({ notifications: [newNotification, ...notifications] });
        },
        markNotificationAsRead: (id) => {
          const { notifications } = get();
          const updatedNotifications = notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          );
          set({ notifications: updatedNotifications });
        },
        removeNotification: (id) => {
          const { notifications } = get();
          const filteredNotifications = notifications.filter(notification => notification.id !== id);
          set({ notifications: filteredNotifications });
        },
        clearNotifications: () => set({ notifications: [] }),
        
        // 交易历史
        transactions: [],
        setTransactions: (transactions) => set({ transactions }),
        addTransaction: (transaction) => {
          const { transactions } = get();
          set({ transactions: [transaction, ...transactions] });
        },
        
        // UI状态
        sidebarOpen: false,
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        // 加载状态
        isLoading: false,
        setIsLoading: (loading) => set({ isLoading: loading }),
        
        // 错误状态
        error: null,
        setError: (error) => set({ error }),
      }),
      {
        name: 'zerolock-app-store',
        partialize: (state) => ({
          theme: state.theme,
          hackerProfile: state.hackerProfile,
          companyProfile: state.companyProfile,
        }),
      }
    ),
    {
      name: 'zerolock-app-store',
    }
  )
);

// 主题初始化
if (typeof window !== 'undefined') {
  const store = useAppStore.getState();
  store.setTheme(store.theme);
  
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    const currentTheme = useAppStore.getState().theme;
    if (currentTheme === 'system') {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  });
}