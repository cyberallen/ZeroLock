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
import Footer from '@/components/Footer';

interface HomePageProps {}

const HomePage: React.FC<HomePageProps> = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters] = useState<ChallengeFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const { challenges, setChallenges } = useAppStore();

  // Updated mock data with English content
  const mockChallenges: Challenge[] = [
    {
      id: 1,
      title: 'DeFi Protocol Security Audit Challenge',
      company: 'DeFi Labs',
      bounty: 10000,
      tokenType: 'ICP',
      timeRemaining: 7 * 24 * 60 * 60 * 1000, // 7 days
      difficulty: 'Hard',
      status: 'Active',
      description: 'Discover security vulnerabilities in our DeFi protocol and earn substantial rewards',
      participantCount: 23,
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    {
      id: 2,
      title: 'NFT Marketplace Smart Contract Challenge',
      company: 'NFT Marketplace',
      bounty: 5000,
      tokenType: 'ICRC1',
      timeRemaining: 3 * 24 * 60 * 60 * 1000, // 3 days
      difficulty: 'Medium',
      status: 'Active',
      description: 'Test the security of our NFT marketplace smart contracts',
      participantCount: 15,
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    },
    {
      id: 3,
      title: 'Decentralized Identity Verification System',
      company: 'Identity Protocol',
      bounty: 8000,
      tokenType: 'ICP',
      timeRemaining: 10 * 24 * 60 * 60 * 1000, // 10 days
      difficulty: 'Hard',
      status: 'Active',
      description: 'Challenge our decentralized identity verification system',
      participantCount: 31,
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000,
    },
    {
      id: 4,
      title: 'Cross-Chain Bridge Security Assessment',
      company: 'Bridge Protocol',
      bounty: 15000,
      tokenType: 'ICP',
      timeRemaining: 14 * 24 * 60 * 60 * 1000, // 14 days
      difficulty: 'Hard',
      status: 'Active',
      description: 'Find vulnerabilities in our cross-chain bridge implementation',
      participantCount: 45,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    },
    {
      id: 5,
      title: 'DAO Governance Contract Review',
      company: 'Governance Labs',
      bounty: 7500,
      tokenType: 'ICRC1',
      timeRemaining: 5 * 24 * 60 * 60 * 1000, // 5 days
      difficulty: 'Medium',
      status: 'Active',
      description: 'Audit our DAO governance smart contracts for security issues',
      participantCount: 28,
      createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
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

  // Get trending challenges (top 3 by participant count)
  const trendingChallenges = [...mockChallenges]
    .sort((a, b) => b.participantCount - a.participantCount)
    .slice(0, 3);

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
            <p className="text-xl md:text-2xl mb-4 opacity-90">
              Make Every Security Test Count, Make Every Vulnerability Matter
            </p>
            <p className="text-lg mb-8 opacity-80 max-w-3xl mx-auto">
              Powered by ZeroTeam
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/hacker-dashboard')}
                className="bg-white text-primary-600 hover:bg-gray-100"
              >
                🎯 Start Challenge
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/company-dashboard')}
                className="border-white text-white hover:bg-white hover:text-primary-600"
              >
                Post Challenge
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Trending Challenges Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              🔥 Trending Challenge Examples
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              See what security challenges other hackers are tackling, join the community,<br/>
              and make your expertise count!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {trendingChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card hover className="cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="warning" className="mb-2">
                        🔥 Trending
                      </Badge>
                      <Badge variant={getDifficultyColor(challenge.difficulty)}>
                        {challenge.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mb-2">{challenge.title}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {challenge.company}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                      {challenge.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <CurrencyDollarIcon className="h-4 w-4 text-success-600" />
                        <span className="font-semibold text-success-600 text-sm">
                          {challenge.bounty.toLocaleString()} {challenge.tokenType}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                        <UserGroupIcon className="h-4 w-4" />
                        <span className="text-sm">{challenge.participantCount}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                        <ClockIcon className="h-4 w-4" />
                        <span className="text-sm">
                          {formatTimeRemaining(challenge.timeRemaining)} left
                        </span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/challenge/${challenge.id}`)}
                      >
                        Join Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              🔥 Ready to Challenge ?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Join the ZeroLock community, create your own security challenges, and engage more people <br/>
              in blockchain security decision-making!
            </p>
          </div>
            <Button 
              size="lg"
              onClick={() => navigate('/hacker-dashboard')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              🚀 Start Challenge Now
            </Button>

          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-3">
            {/* Search and filters */}
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

              {/* Filter panel */}
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

            {/* Challenge list */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                All Security Challenges
              </h3>
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
                            {challenge.status}
                          </Badge>
                          <Badge variant={getDifficultyColor(challenge.difficulty)}>
                            {challenge.difficulty}
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

          {/* Sidebar */}
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

      <Footer />
    </div>
  );
};

export default HomePage;