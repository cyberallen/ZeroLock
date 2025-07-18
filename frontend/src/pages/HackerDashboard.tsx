import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrophyIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  StarIcon,
  FireIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { HackerProfile, AttackAttempt, Achievement, Challenge } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { useAppStore } from '@/stores/useAppStore';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface HackerDashboardProps {}

const HackerDashboard: React.FC<HackerDashboardProps> = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attempts' | 'achievements' | 'profile'>('overview');
  const { hackerProfile, setHackerProfile } = useAppStore();

  // Mock hacker profile data
  const mockHackerProfile: HackerProfile = {
    principal: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
    nickname: 'CryptoHacker',
    avatar: '',
    bio: 'White hat hacker focused on smart contract security research with 5 years of blockchain security experience.',
    skills: ['Solidity', 'Rust', 'Smart Contract Auditing', 'DeFi', 'Cryptography'],
    reputation: 950,
    rank: 1,
    totalEarnings: 50000,
    successfulHacks: 15,
    totalAttempts: 23,
    joinedAt: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
    lastActiveAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    socialLinks: {
      twitter: 'https://twitter.com/cryptohacker',
      github: 'https://github.com/cryptohacker',
      website: 'https://cryptohacker.dev',
    },
    achievements: [
      {
        id: 1,
        title: 'First Success',
        description: 'Complete your first successful security audit',
        icon: 'trophy',
        rarity: 'Common',
        unlockedAt: Date.now() - 300 * 24 * 60 * 60 * 1000,
        progress: 100,
      },
      {
        id: 2,
        title: 'Combo Master',
        description: 'Successfully discover vulnerabilities 5 times in a row',
        icon: 'fire',
        rarity: 'Rare',
        unlockedAt: Date.now() - 100 * 24 * 60 * 60 * 1000,
        progress: 100,
      },
      {
        id: 3,
        title: 'Millionaire',
        description: 'Accumulate earnings of 100,000 ICP',
        icon: 'currency',
        rarity: 'Epic',
        unlockedAt: null,
        progress: 50,
      },
    ],
  };

  // Mock attack attempt data
  const mockAttempts: AttackAttempt[] = [
    {
      id: 1,
      challengeId: 1,
      challengeTitle: 'DeFi Protocol Security Audit Challenge',
      submittedAt: Date.now() - 2 * 60 * 60 * 1000,
      status: 'Under Review',
      severity: 'High',
      description: 'Discovered reentrancy attack vulnerability that could lead to fund loss',
      code: 'contract Attack { ... }',
      reward: 0,
      feedback: '',
    },
    {
      id: 2,
      challengeId: 2,
      challengeTitle: 'NFT Marketplace Smart Contract Challenge',
      submittedAt: Date.now() - 24 * 60 * 60 * 1000,
      status: 'Approved',
      severity: 'Medium',
      description: 'Integer overflow vulnerability',
      code: 'function exploit() { ... }',
      reward: 2000,
      feedback: 'Excellent discovery! Accurate vulnerability analysis with practical fix suggestions.',
    },
    {
      id: 3,
      challengeId: 3,
      challengeTitle: 'Decentralized Identity Verification System',
      submittedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      status: 'Rejected',
      severity: 'Low',
      description: 'Insufficient permission checks',
      code: 'if (msg.sender == owner) { ... }',
      reward: 0,
      feedback: 'This vulnerability has minimal impact and does not meet reward criteria.',
    },
  ];

  // Mock recommended challenges
  const mockRecommendedChallenges: Challenge[] = [
    {
      id: 4,
      title: 'Cross-Chain Bridge Security Challenge',
      company: 'Bridge Protocol',
      bounty: 15000,
      tokenType: 'ICP',
      timeRemaining: 14 * 24 * 60 * 60 * 1000,
      difficulty: 'Hard',
      status: 'Active',
      description: 'Test the security of our cross-chain bridge',
      participantCount: 8,
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    },
    {
      id: 5,
      title: 'DAO Governance Contract Audit',
      company: 'Governance Labs',
      bounty: 8000,
      tokenType: 'ICRC1',
      timeRemaining: 21 * 24 * 60 * 60 * 1000,
      difficulty: 'Medium',
      status: 'Active',
      description: 'Audit our DAO governance smart contract',
      participantCount: 12,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 21 * 24 * 60 * 60 * 1000,
    },
  ];

  useEffect(() => {
    setHackerProfile(mockHackerProfile);
  }, [setHackerProfile]);

  const getStatusColor = (status: AttackAttempt['status']) => {
    switch (status) {
      case 'Under Review': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: AttackAttempt['severity']) => {
    switch (severity) {
      case 'Critical': return 'danger';
      case 'High': return 'danger';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'Common': return 'default';
      case 'Rare': return 'primary';
      case 'Epic': return 'warning';
      case 'Legendary': return 'danger';
      default: return 'default';
    }
  };

  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'trophy': return <TrophyIcon className="h-6 w-6" />;
      case 'fire': return <FireIcon className="h-6 w-6" />;
      case 'currency': return <CurrencyDollarIcon className="h-6 w-6" />;
      case 'star': return <StarIcon className="h-6 w-6" />;
      default: return <TrophyIcon className="h-6 w-6" />;
    }
  };

  const successRate = hackerProfile ? Math.round((hackerProfile.successfulHacks / hackerProfile.totalAttempts) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Hacker Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your security research activities and achievements</p>
        </div>

        {/* Tab navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: ChartBarIcon },
              { key: 'attempts', label: 'Submissions', icon: ClockIcon },
              { key: 'achievements', label: 'Achievements', icon: TrophyIcon },
              { key: 'profile', label: 'Profile', icon: UserIcon },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`
                  flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${activeTab === key
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main statistics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Statistics cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TrophyIcon className="h-8 w-8 text-warning-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rank</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">#{hackerProfile?.rank}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CurrencyDollarIcon className="h-8 w-8 text-success-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earnings</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {hackerProfile?.totalEarnings.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-8 w-8 text-primary-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Successful Hacks</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {hackerProfile?.successfulHacks}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-8 w-8 text-purple-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Success Rate</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{successRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAttempts.slice(0, 3).map((attempt) => (
                      <div key={attempt.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-shrink-0">
                          {attempt.status === 'Approved' ? (
                            <CheckCircleIcon className="h-6 w-6 text-success-500" />
                          ) : attempt.status === 'Rejected' ? (
                            <XCircleIcon className="h-6 w-6 text-danger-500" />
                          ) : (
                            <ClockIcon className="h-6 w-6 text-warning-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {attempt.challengeTitle}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {attempt.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant={getStatusColor(attempt.status)} size="sm">
                              {attempt.status === 'Under Review' ? 'Under Review' :
                               attempt.status === 'Approved' ? 'Approved' : 'Rejected'}
                            </Badge>
                            <Badge variant={getSeverityColor(attempt.severity)} size="sm">
                              {attempt.severity === 'Critical' ? 'Critical' :
                               attempt.severity === 'High' ? 'High' :
                               attempt.severity === 'Medium' ? 'Medium' : 'Low'}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(attempt.submittedAt, { addSuffix: true, locale: zhCN })}
                            </span>
                          </div>
                        </div>
                        {attempt.reward > 0 && (
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-medium text-success-600">
                              +{attempt.reward.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Personal info card */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">
                        {hackerProfile?.nickname.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {hackerProfile?.nickname}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Reputation: {hackerProfile?.reputation}
                    </p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {hackerProfile?.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" size="sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommended challenges */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecommendedChallenges.map((challenge) => (
                      <div key={challenge.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {challenge.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {challenge.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-success-600">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {challenge.bounty.toLocaleString()}
                            </span>
                          </div>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Submissions tab */}
        {activeTab === 'attempts' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockAttempts.map((attempt) => (
                    <div key={attempt.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {attempt.challengeTitle}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {attempt.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>
                              Submitted: {formatDistanceToNow(attempt.submittedAt, { addSuffix: true, locale: zhCN })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge variant={getStatusColor(attempt.status)}>
                            {attempt.status === 'Under Review' ? 'Under Review' :
                             attempt.status === 'Approved' ? 'Approved' : 'Rejected'}
                          </Badge>
                          <Badge variant={getSeverityColor(attempt.severity)}>
                            {attempt.severity === 'Critical' ? 'Critical' :
                             attempt.severity === 'High' ? 'High' :
                             attempt.severity === 'Medium' ? 'Medium' : 'Low'}
                          </Badge>
                          {attempt.reward > 0 && (
                            <div className="flex items-center space-x-1 text-success-600">
                              <CurrencyDollarIcon className="h-4 w-4" />
                              <span className="font-medium">{attempt.reward.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {attempt.feedback && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Feedback</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{attempt.feedback}</p>
                        </div>
                      )}
                      
                      <div className="flex space-x-4">
                        <Button size="sm" variant="outline" leftIcon={<EyeIcon className="h-4 w-4" />}>
                          View Code
                        </Button>
                        <Button size="sm" variant="outline">
                          View Challenge
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Achievements tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievement System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hackerProfile?.achievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      whileHover={{ scale: 1.02 }}
                      className={`
                        border-2 rounded-lg p-6 text-center transition-all
                        ${achievement.unlockedAt
                          ? 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                        }
                      `}
                    >
                      <div className={`
                        w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center
                        ${achievement.unlockedAt
                          ? 'bg-success-100 text-success-600 dark:bg-success-800 dark:text-success-300'
                          : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                        }
                      `}>
                        {getAchievementIcon(achievement.icon)}
                      </div>
                      
                      <h3 className={`
                        text-lg font-semibold mb-2
                        ${achievement.unlockedAt
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-gray-500 dark:text-gray-400'
                        }
                      `}>
                        {achievement.title}
                      </h3>
                      
                      <p className={`
                        text-sm mb-4
                        ${achievement.unlockedAt
                          ? 'text-gray-600 dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-500'
                        }
                      `}>
                        {achievement.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant={getRarityColor(achievement.rarity)} size="sm">
                          {achievement.rarity === 'Common' ? 'Common' :
                           achievement.rarity === 'Rare' ? 'Rare' :
                           achievement.rarity === 'Epic' ? 'Epic' : 'Legendary'}
                        </Badge>
                        {achievement.unlockedAt && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(achievement.unlockedAt, { addSuffix: true, locale: zhCN })}
                          </span>
                        )}
                      </div>
                      
                      {!achievement.unlockedAt && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-3xl">
                        {hackerProfile?.nickname.charAt(0)}
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nickname</label>
                      <Input value={hackerProfile?.nickname || ''} />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                      <textarea
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[100px]"
                        value={hackerProfile?.bio || ''}
                        placeholder="Tell us about your skills and experience..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {hackerProfile?.skills.map((skill: string) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                            <button className="ml-1 text-gray-400 hover:text-gray-600">
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Input placeholder="Add new skill..." />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Twitter</label>
                    <Input value={hackerProfile?.socialLinks?.twitter || ''} placeholder="https://twitter.com/username" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GitHub</label>
                    <Input value={hackerProfile?.socialLinks?.github || ''} placeholder="https://github.com/username" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                    <Input value={hackerProfile?.socialLinks?.website || ''} placeholder="https://yourwebsite.com" />
                  </div>
                  
                  <div className="pt-4">
                    <Button>Save Changes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default HackerDashboard;