import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import HomePage from '@/pages/HomePage';
import ChallengeDetailPage from '@/pages/ChallengeDetailPage';
import HackerDashboard from '@/pages/HackerDashboard';
import CompanyDashboard from '@/pages/CompanyDashboard';
import WalletConnector from '@/components/WalletConnector';
import {
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  TrophyIcon,
  UserIcon,
  BuildingOfficeIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

const App: React.FC = () => {
  const { theme, setTheme, sidebarOpen, setSidebarOpen, notifications } = useAppStore();
  const { isAuthenticated, userType, logout } = useAuth();

  // Theme toggle
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Navigation menu items
  const navigationItems = [
    { name: 'Home', href: '/', icon: HomeIcon, current: true },
    { name: 'Challenges', href: '/company-dashboard', icon: TrophyIcon, current: false },
    ...(isAuthenticated && userType === 'hacker' ? [
      { name: 'Hacker Dashboard', href: '/hacker-dashboard', icon: UserIcon, current: false }
    ] : []),
    ...(isAuthenticated && userType === 'company' ? [
      { name: 'Company Dashboard', href: '/company-dashboard', icon: BuildingOfficeIcon, current: false }
    ] : []),
  ];

  // Unread notification count
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <Router>
      <div className={cn(
        'min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200',
        theme === 'dark' && 'dark'
      )}>
        {/* Top navigation bar */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Left side - Logo and navigation */}
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                >
                  {sidebarOpen ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </button>

                {/* Logo */}
                <div className="flex-shrink-0 flex items-center ml-4 md:ml-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Z</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      ZeroLock
                    </span>
                  </div>
                </div>

                {/* Desktop navigation menu */}
                <div className="hidden md:ml-10 md:flex md:space-x-8">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors',
                          item.current
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                        )}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.name}
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Right side - notifications, theme toggle, user menu */}
              <div className="flex items-center space-x-4">
                {/* Notification button */}
                {isAuthenticated && (
                  <button className="relative p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                    <BellIcon className="h-6 w-6" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>
                )}

                {/* Theme toggle button */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  {theme === 'light' ? (
                    <MoonIcon className="h-6 w-6" />
                  ) : (
                    <SunIcon className="h-6 w-6" />
                  )}
                </button>

                {/* Wallet connector */}
                <WalletConnector />

                {/* User menu */}
                {isAuthenticated && (
                  <div className="relative">
                    <button
                      className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      onClick={logout}
                    >
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Background overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />

              {/* Sidebar */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg md:hidden"
              >
                <div className="flex flex-col h-full">
                  {/* Sidebar header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">Z</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        ZeroLock
                      </span>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Navigation menu */}
                  <nav className="flex-1 px-4 py-4 space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            item.current
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          {item.name}
                        </a>
                      );
                    })}
                  </nav>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/challenge/:id" element={<ChallengeDetailPage />} />
            <Route path="/hacker-dashboard" element={<HackerDashboard />} />
            <Route path="/company-dashboard" element={<CompanyDashboard />} />
            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: theme === 'dark' ? '#374151' : '#ffffff',
              color: theme === 'dark' ? '#f9fafb' : '#111827',
              border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
};

export default App;