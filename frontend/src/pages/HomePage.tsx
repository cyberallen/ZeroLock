import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { Challenge, HackerRank, ChallengeFilters } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/stores/useAppStore';


interface HomePageProps {}

const HomePage: React.FC<HomePageProps> = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters] = useState<ChallengeFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const { challenges, setChallenges } = useAppStore();

  // 模拟数据
  const mockChallenges: Challenge[] = [
    {
      id: 1,
      title: 'DeFi协议安全审计挑战',
      company: 'DeFi Labs',
      bounty: 10000,
      tokenType: 'ICP',
      timeRemaining: 7 * 24 * 60 * 60 * 1000, // 7天
      difficulty: 'Hard',
      status: 'Active',
      description: '发现我们DeFi协议中的安全漏洞，获得丰厚奖励',
      participantCount: 23,
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    {
      id: 2,
      title: 'NFT市场智能合约挑战',
      company: 'NFT Marketplace',
      bounty: 5000,
      tokenType: 'ICRC1',
      timeRemaining: 3 * 24 * 60 * 60 * 1000, // 3天
      difficulty: 'Medium',
      status: 'Active',
      description: '测试我们NFT市场的智能合约安全性',
      participantCount: 15,
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    },
    {
      id: 3,
      title: '去中心化身份验证系统',
      company: 'Identity Protocol',
      bounty: 8000,
      tokenType: 'ICP',
      timeRemaining: 10 * 24 * 60 * 60 * 1000, // 10天
      difficulty: 'Hard',
      status: 'Active',
      description: '挑战我们的去中心化身份验证系统',
      participantCount: 31,
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000,
    },
  ];

  const mockHackerRanks: HackerRank[] = [
    {
      rank: 1,
      principal: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
      nickname: 'CryptoHacker',
      successCount: 15,
      totalEarnings: 50000,
      reputation: 950,
    },
    {
      rank: 2,
      principal: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
      nickname: 'SecurityExpert',
      successCount: 12,
      totalEarnings: 38000,
      reputation: 890,
    },
    {
      rank: 3,
      principal: 'rno2w-sqaaa-aaaaa-aaacq-cai',
      nickname: 'WhiteHat',
      successCount: 10,
      totalEarnings: 32000,
      reputation: 850,
    },
  ];

  useEffect(() => {
    setChallenges(mockChallenges);
  }, [setChallenges]);

  const filteredChallenges = challenges.filter(challenge => {
    if (searchTerm && !challenge.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.status && !filters.status.includes(challenge.status)) {
      return false;
    }
    if (filters.difficulty && !filters.difficulty.includes(challenge.difficulty)) {
      return false;
    }
    if (filters.tokenType && !filters.tokenType.includes(challenge.tokenType)) {
      return false;
    }
    return true;
  });

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'danger';
      default: return 'default';
    }
  };

  const getStatusColor = (status: Challenge['status']) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Completed': return 'primary';
      case 'Expired': return 'default';
      default: return 'default';
    }
  };

  const formatTimeRemaining = (timeRemaining: number) => {
    const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              ZeroLock
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Decentralized Security Bounty Platform
            </p>
            <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
              Find vulnerabilities, earn rewards. Connecting the world's best security researchers with blockchain projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/hacker-dashboard')}
              >
                Start Challenge
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/company-dashboard')}
              >
                Post Challenge
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 主要内容区域 */}
          <div className="lg:col-span-3">
            {/* 搜索和过滤 */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search challenges..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  leftIcon={<FunnelIcon className="h-4 w-4" />}
                >
                  Filters
                </Button>
              </div>

              {/* 过滤器面板 */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Status</label>
                      <select className="input">
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Difficulty</label>
                      <select className="input">
                        <option value="">All Difficulties</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Token Type</label>
                      <select className="input">
                        <option value="">All Types</option>
                        <option value="ICP">ICP</option>
                        <option value="ICRC1">ICRC1</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* 挑战列表 */}
            <div className="space-y-6">
              {filteredChallenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card hover className="cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="mb-2">{challenge.title}</CardTitle>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>{challenge.company}</span>
                            <div className="flex items-center space-x-1">
                              <UserGroupIcon className="h-4 w-4" />
                              <span>{challenge.participantCount} participants</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge variant={getStatusColor(challenge.status)}>
                            {challenge.status === 'Active' ? 'Active' : 
                             challenge.status === 'Completed' ? 'Completed' : 'Expired'}
                          </Badge>
                          <Badge variant={getDifficultyColor(challenge.difficulty)}>
                            {challenge.difficulty === 'Easy' ? 'Easy' :
                             challenge.difficulty === 'Medium' ? 'Medium' : 'Hard'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {challenge.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <CurrencyDollarIcon className="h-5 w-5 text-success-600" />
                            <span className="font-semibold text-success-600">
                              {challenge.bounty.toLocaleString()} {challenge.tokenType}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                            <ClockIcon className="h-4 w-4" />
                            <span className="text-sm">
                              {formatTimeRemaining(challenge.timeRemaining)} remaining
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/challenge/${challenge.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* Hacker Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrophyIcon className="h-5 w-5 text-warning-500" />
                  <span>Hacker Leaderboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockHackerRanks.map((hacker) => (
                    <div key={hacker.rank} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                          ${hacker.rank === 1 ? 'bg-warning-100 text-warning-800' :
                            hacker.rank === 2 ? 'bg-gray-100 text-gray-800' :
                            hacker.rank === 3 ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-50 text-gray-600'}
                        `}>
                          {hacker.rank}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {hacker.nickname}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {hacker.successCount} successful
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-success-600">
                          {hacker.totalEarnings.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Reputation: {hacker.reputation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Platform Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Challenges</span>
                    <span className="font-semibold">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Active Hackers</span>
                    <span className="font-semibold">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Bounty Pool</span>
                    <span className="font-semibold text-success-600">2.5M ICP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                    <span className="font-semibold">78%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;