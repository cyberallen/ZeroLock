import React, { useState, useEffect } from 'react';

import {
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CheckCircleIcon,

  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { CompanyProfile, Challenge, AttackAttempt } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/stores/useAppStore';
import { formatDistanceToNow } from 'date-fns';


interface CompanyDashboardProps {}

const CompanyDashboard: React.FC<CompanyDashboardProps> = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'challenges' | 'submissions' | 'profile'>('overview');

  const { companyProfile, setCompanyProfile, challenges, setChallenges } = useAppStore();

  // 模拟公司档案数据
  const mockCompanyProfile: CompanyProfile = {
    principal: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
    name: 'DeFi Labs',
    logo: '',
    description: 'Leading company focused on decentralized finance protocol development, committed to building secure and efficient DeFi ecosystems.',
    website: 'https://defi-labs.com',
    industry: 'DeFi',
    foundedYear: 2020,
    teamSize: 75,
    location: 'Singapore',
    totalBountyPaid: 150000,
    totalChallenges: 15,
    activeChallenges: 3,
    completedChallenges: 12,
    successfulHacks: 8,
    averageTimeToHack: 5.2,
    averageResolutionTime: 7, // 天
    reputation: 4.8,
    joinedAt: Date.now() - 2 * 365 * 24 * 60 * 60 * 1000, // 2年前
    socialLinks: {
      twitter: 'https://twitter.com/defilabs',
      linkedin: 'https://linkedin.com/company/defi-labs',
      website: 'https://defi-labs.com',
    },
    verificationStatus: 'verified' as const,
    securityScore: 95,
  };

  // 模拟公司挑战数据
  const mockCompanyChallenges: Challenge[] = [
    {
      id: 1,
      title: 'DeFi Protocol Security Audit Challenge',
      company: 'DeFi Labs',
      bounty: 10000,
      tokenType: 'ICP',
      timeRemaining: 7 * 24 * 60 * 60 * 1000,
      difficulty: 'Hard',
      status: 'Active',
      description: 'Discover security vulnerabilities in our DeFi protocol and earn generous rewards',
      participantCount: 23,
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    {
      id: 6,
      title: 'Liquidity Mining Contract Audit',
      company: 'DeFi Labs',
      bounty: 8000,
      tokenType: 'ICP',
      timeRemaining: 14 * 24 * 60 * 60 * 1000,
      difficulty: 'Medium',
      status: 'Active',
      description: 'Test our new liquidity mining smart contract',
      participantCount: 15,
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    },
    {
      id: 7,
      title: 'Governance Token Contract Challenge',
      company: 'DeFi Labs',
      bounty: 5000,
      tokenType: 'ICRC1',
      timeRemaining: 0,
      difficulty: 'Easy',
      status: 'Completed',
      description: 'Completed governance token security audit',
      participantCount: 8,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    },
  ];

  // 模拟提交记录
  const mockSubmissions: AttackAttempt[] = [
    {
      id: '1',
      attacker: 'CryptoHacker',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      method: 'reentrancy',
      success: false,
      gasUsed: 50000,
      challengeTitle: 'DeFi Protocol Security Audit Challenge',
      hackerNickname: 'CryptoHacker',
      submittedAt: Date.now() - 2 * 60 * 60 * 1000,
      status: 'pending',
      severity: 'high',
      description: 'Discovered reentrancy attack vulnerability that could lead to fund loss',
      reward: 0,
      feedback: '',
    },
    {
      id: '2',
      attacker: 'WhiteHat',
      timestamp: Date.now() - 6 * 60 * 60 * 1000,
      method: 'overflow',
      success: true,
      gasUsed: 30000,
      challengeTitle: 'DeFi Protocol Security Audit Challenge',
      hackerNickname: 'WhiteHat',
      submittedAt: Date.now() - 6 * 60 * 60 * 1000,
      status: 'approved',
      severity: 'medium',
      description: 'Integer overflow vulnerability',
      reward: 2000,
      feedback: 'Excellent discovery! Accurate vulnerability analysis and practical fix suggestions.',
    },
    {
      id: '3',
      attacker: 'SecurityExpert',
      timestamp: Date.now() - 12 * 60 * 60 * 1000,
      method: 'permission',
      success: false,
      gasUsed: 20000,
      challengeTitle: 'Liquidity Mining Contract Audit',
      hackerNickname: 'SecurityExpert',
      submittedAt: Date.now() - 12 * 60 * 60 * 1000,
      status: 'rejected',
      severity: 'low',
      description: 'Insufficient permission checks',
      reward: 0,
      feedback: 'This vulnerability has minimal impact and does not meet reward criteria.',
    },
  ];

  useEffect(() => {
    setCompanyProfile(mockCompanyProfile);
    setChallenges(mockCompanyChallenges);
  }, [setCompanyProfile, setChallenges]);

  const getStatusColor = (status: Challenge['status']) => {
    switch (status) {
      case 'Active': return 'success' as const;
      case 'Completed': return 'primary' as const;
      case 'Expired': return 'default' as const;
      default: return 'default' as const;
    }
  };



  const getSeverityColor = (severity: AttackAttempt['severity']) => {
    switch (severity) {
      case 'critical': return 'danger' as const;
      case 'high': return 'danger' as const;
      case 'medium': return 'warning' as const;
      case 'low': return 'success' as const;
      default: return 'default' as const;
    }
  };

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'Easy': return 'success' as const;
      case 'Medium': return 'warning' as const;
      case 'Hard': return 'danger' as const;
      default: return 'default' as const;
    }
  };

  const formatTimeRemaining = (timeRemaining: number) => {
    if (timeRemaining <= 0) return 'Ended';
    const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  const activeChallenges = challenges.filter(c => c.status === 'Active');
  const pendingSubmissions = mockSubmissions.filter(s => s.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Company Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your security challenges and bug bounty programs</p>
        </div>

        {/* Tab navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: ChartBarIcon },
              { key: 'challenges', label: 'Challenge Management', icon: ClockIcon },
              { key: 'submissions', label: 'Submission Review', icon: CheckCircleIcon },
              { key: 'profile', label: 'Company Profile', icon: BuildingOfficeIcon },
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
                        <ClockIcon className="h-8 w-8 text-primary-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Challenges</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {companyProfile?.activeChallenges}
                        </p>
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
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bounty</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {companyProfile?.totalBountyPaid.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-8 w-8 text-warning-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {companyProfile?.completedChallenges}
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
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Security Score</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {companyProfile?.securityScore}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pending submissions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pending Submissions</CardTitle>
                    <Badge variant="warning">{pendingSubmissions.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {pendingSubmissions.length > 0 ? (
                    <div className="space-y-4">
                      {pendingSubmissions.map((submission) => (
                        <div key={submission.id} className="flex items-start space-x-4 p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                          <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-6 w-6 text-warning-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {submission.challengeTitle}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Submitted by: {submission.hackerNickname}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {submission.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant={getSeverityColor(submission.severity)} size="sm">
                                {submission.severity === 'critical' ? 'Critical' :
                                 submission.severity === 'high' ? 'High' :
                                 submission.severity === 'medium' ? 'Medium' : 'Low'}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(submission.submittedAt, { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              Review
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No pending submissions
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Active challenges */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Active Challenges</CardTitle>
                    <Button size="sm" leftIcon={<PlusIcon className="h-4 w-4" />}>
                      Create Challenge
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeChallenges.map((challenge) => (
                      <div key={challenge.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {challenge.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {challenge.description}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant={getStatusColor(challenge.status)}>
                              {challenge.status === 'Active' ? 'Active' : 'Ended'}
                            </Badge>
                            <Badge variant={getDifficultyColor(challenge.difficulty)}>
                              {challenge.difficulty === 'Easy' ? 'Easy' :
                               challenge.difficulty === 'Medium' ? 'Medium' : 'Hard'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <CurrencyDollarIcon className="h-4 w-4" />
                              <span>{challenge.bounty.toLocaleString()} {challenge.tokenType}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <UserGroupIcon className="h-4 w-4" />
                              <span>{challenge.participantCount} participants</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="h-4 w-4" />
                              <span>{formatTimeRemaining(challenge.timeRemaining)}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              leftIcon={<EyeIcon className="h-4 w-4" />}
                              onClick={() => alert('View challenge details feature coming soon!')}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              leftIcon={<PencilIcon className="h-4 w-4" />}
                              onClick={() => alert('Edit challenge feature coming soon!')}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Company info card */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">
                        {companyProfile?.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {companyProfile?.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {companyProfile?.industry}
                    </p>
                    <div className="flex items-center justify-center space-x-1 mb-4">
                      <div className="flex text-warning-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {companyProfile?.reputation}
                      </span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      {companyProfile?.verificationStatus === 'verified' && (
                        <CheckBadgeIcon className={`h-5 w-5 ${
                          companyProfile.verificationStatus === 'verified' ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                      )}
                      <span className={`text-sm ${
                        companyProfile?.verificationStatus === 'verified' ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {companyProfile?.verificationStatus === 'verified' ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Resolution Time</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">7 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Team Size</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">50-100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Founded Year</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">2020</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Singapore</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full" 
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                    onClick={() => setActiveTab('challenges')}
                  >
                    Create New Challenge
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    leftIcon={<ChartBarIcon className="h-4 w-4" />}
                    onClick={() => alert('View analytics feature coming soon!')}
                  >
                    View Analytics
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    leftIcon={<UserGroupIcon className="h-4 w-4" />}
                    onClick={() => alert('Invite hackers feature coming soon!')}
                  >
                    Invite Hackers
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Challenge Management tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Challenge Management</h2>
              <Button leftIcon={<PlusIcon className="h-4 w-4" />}>
                Create New Challenge
              </Button>
            </div>

            <div className="grid gap-6">
              {challenges.map((challenge) => (
                <Card key={challenge.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {challenge.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {challenge.description}
                        </p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            <span>{challenge.bounty.toLocaleString()} {challenge.tokenType}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <UserGroupIcon className="h-4 w-4" />
                            <span>{challenge.participantCount} participants</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>{formatTimeRemaining(challenge.timeRemaining)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge variant={getStatusColor(challenge.status)}>
                          {challenge.status}
                        </Badge>
                        <Badge variant={getDifficultyColor(challenge.difficulty)}>
                          {challenge.difficulty}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        leftIcon={<EyeIcon className="h-4 w-4" />}
                        onClick={() => alert(`Viewing details for ${challenge.title}`)}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        leftIcon={<PencilIcon className="h-4 w-4" />}
                        onClick={() => alert(`Editing ${challenge.title}`)}
                      >
                        Edit
                      </Button>
                      {challenge.status === 'Active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => alert(`Pausing ${challenge.title}`)}
                        >
                          Pause
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="danger" 
                        leftIcon={<TrashIcon className="h-4 w-4" />}
                        onClick={() => alert(`Deleting ${challenge.title}`)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Submission Review tab */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Submission Review</h2>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option>All Submissions</option>
                  <option>Pending Review</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option>All Severities</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6">
              {mockSubmissions.map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {submission.challengeTitle}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Submitted by: <span className="font-medium">{submission.hackerNickname}</span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {submission.description}
                        </p>
                        
                        <div className="flex items-center space-x-2 mb-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {submission.status === 'pending' ? 'Under Review' :
                             submission.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            submission.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            submission.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            submission.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {submission.severity === 'critical' ? 'Critical' :
                             submission.severity === 'high' ? 'High' :
                             submission.severity === 'medium' ? 'Medium' : 'Low'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(submission.submittedAt, { addSuffix: true })}
                          </span>
                        </div>
                        
                        {submission.reward > 0 && (
                          <div className="flex items-center space-x-1 text-sm text-success-600 dark:text-success-400">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            <span>Reward: {submission.reward.toLocaleString()} ICP</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        leftIcon={<EyeIcon className="h-4 w-4" />}
                        onClick={() => alert(`Viewing code for ${submission.challengeTitle}`)}
                      >
                        View Code
                      </Button>
                      {submission.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="success"
                            onClick={() => alert(`Approving submission for ${submission.challengeTitle}`)}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="danger"
                            onClick={() => alert(`Rejecting submission for ${submission.challengeTitle}`)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Company Profile tab */}
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
                        {companyProfile?.name.charAt(0)}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => alert('Change logo feature coming soon!')}
                    >
                      Change Logo
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Company Name</label>
                      <Input value={companyProfile?.name} />
                    </div>
                    
                    <div>
                      <label className="label">Company Description</label>
                      <textarea
                        className="input min-h-[100px]"
                        value={companyProfile?.description}
                        placeholder="Introduce your company and business..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Industry</label>
                        <Input value={companyProfile?.industry} />
                      </div>
                      <div>
                        <label className="label">Founded Year</label>
                        <Input value={companyProfile?.foundedYear?.toString()} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Team Size</label>
                        <select className="input">
                          <option value="1-10">1-10 people</option>
                          <option value="11-50">11-50 people</option>
                          <option value="51-100">51-100 people</option>
                          <option value="100+">100+ people</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Location</label>
                        <Input value={companyProfile?.location} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="label">Official Website</label>
                    <Input value={companyProfile?.website} placeholder="https://yourcompany.com" />
                  </div>
                  
                  <div>
                    <label className="label">Twitter</label>
                    <Input value={companyProfile?.socialLinks?.twitter} placeholder="https://twitter.com/company" />
                  </div>
                  
                  <div>
                    <label className="label">LinkedIn</label>
                    <Input value={companyProfile?.socialLinks?.linkedin} placeholder="https://linkedin.com/company/company" />
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

export default CompanyDashboard;