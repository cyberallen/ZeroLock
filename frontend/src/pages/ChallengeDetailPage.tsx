import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Principal } from '@dfinity/principal';
import {
  ArrowLeftIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { ChallengeDetail, AttackAttempt } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/stores/useAppStore';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ChallengeDetailPageProps {}

const ChallengeDetailPage: React.FC<ChallengeDetailPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [attackCode, setAttackCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const { addNotification } = useAppStore();

  // 模拟挑战详情数据
  const mockChallengeDetail: ChallengeDetail = {
    id: parseInt(id || '1'),
    title: 'DeFi协议安全审计挑战',
    company: 'DeFi Labs',
    companyLogo: '',
    bounty: 10000,
    tokenType: 'ICP',
    timeRemaining: 7 * 24 * 60 * 60 * 1000,
    difficulty: 'Hard',
    status: 'Active',
    description: '我们的DeFi协议处理数百万美元的资产，需要最高级别的安全保障。我们邀请全球顶尖的安全研究人员来测试我们的智能合约，发现潜在的漏洞。',
    participantCount: 23,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    contractCode: 'import Principal "mo:base/Principal";\nimport Time "mo:base/Time";\n\nactor DeFiProtocol {\n  // Contract implementation\n}',
    candidInterface: 'service : {\n  deposit: (nat) -> (bool);\n  withdraw: (nat) -> (bool);\n}',
    currentBalance: 1000000,
    initialBalance: 1000000,
    attackHistory: [],
    contractLanguage: 'Motoko',
    creator: Principal.fromText('rdmx6-jaaaa-aaaaa-aaadq-cai'),
    canisterId: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
    requirements: [
      '发现智能合约中的重大安全漏洞',
      '提供完整的攻击向量和概念验证',
      '漏洞必须是可利用的且影响资金安全',
      '提交详细的修复建议'
    ],
    rules: [
      '不得对生产环境进行实际攻击',
      '仅在测试网络上进行测试',
      '遵守负责任的披露原则',
      '不得泄露漏洞细节给第三方'
    ],
    targetContract: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
    sourceCode: 'https://github.com/defi-labs/protocol',
    documentation: 'https://docs.defi-labs.com',
    testnetUrl: 'https://testnet.defi-labs.com',
    submissionCount: 8,
    successfulHacks: 2,
    recentAttempts: [
      {
          id: '1',
          attacker: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
          timestamp: Date.now() - 2 * 60 * 60 * 1000,
          method: 'reentrancy',
          success: false,
          gasUsed: 150000,
          hackerNickname: 'CryptoHacker',
          submittedAt: Date.now() - 2 * 60 * 60 * 1000,
          status: 'pending',
          severity: 'high',
          challengeTitle: 'DeFi协议安全审计挑战',
          description: '发现重入攻击漏洞，可能导致资金流失',
          reward: 0,
        },
      {
          id: '2',
          attacker: 'rno2w-sqaaa-aaaaa-aaacq-cai',
          timestamp: Date.now() - 6 * 60 * 60 * 1000,
          method: 'integer_overflow',
          success: true,
          gasUsed: 120000,
          hackerNickname: 'WhiteHat',
          submittedAt: Date.now() - 6 * 60 * 60 * 1000,
          status: 'approved',
          severity: 'medium',
          challengeTitle: 'DeFi协议安全审计挑战',
          description: '整数溢出漏洞',
          reward: 2000,
        },
      {
          id: '3',
          attacker: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
          timestamp: Date.now() - 12 * 60 * 60 * 1000,
          method: 'access_control',
          success: false,
          gasUsed: 80000,
          hackerNickname: 'SecurityExpert',
          submittedAt: Date.now() - 12 * 60 * 60 * 1000,
          status: 'rejected',
          severity: 'low',
          challengeTitle: 'DeFi协议安全审计挑战',
          description: '权限检查不足',
          reward: 0,
        },
    ],
  };

  useEffect(() => {
    // 模拟加载挑战详情
    setChallenge(mockChallengeDetail);
  }, [id]);

  const handleSubmitAttack = async () => {
    if (!attackCode.trim()) {
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: 'Please enter attack code',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟提交攻击
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addNotification({
        type: 'success',
        title: 'Submission Successful',
        message: 'Your attack has been submitted and is awaiting review',
      });
      
      setAttackCode('');
      setShowSubmissionForm(false);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: 'Network error, please try again later',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: ChallengeDetail['difficulty']) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'danger';
      default: return 'default';
    }
  };

  const getStatusColor = (status: AttackAttempt['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: AttackAttempt['severity']) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatTimeRemaining = (timeRemaining: number) => {
    const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days} days ${hours} hours`;
    }
    return `${hours} hours`;
  };

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          className="mb-6"
        >
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Challenge basic information */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{challenge.title}</CardTitle>
                    <p className="text-gray-600 dark:text-gray-400">{challenge.company}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant={challenge.status === 'Active' ? 'success' : 'default'}>
                      {challenge.status === 'Active' ? 'Active' : 'Ended'}
                    </Badge>
                    <Badge variant={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty === 'Easy' ? 'Easy' :
                       challenge.difficulty === 'Medium' ? 'Medium' : 'Hard'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  {challenge.description}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-success-600 mb-1">
                      <CurrencyDollarIcon className="h-5 w-5" />
                      <span className="font-bold text-lg">{challenge.bounty.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bounty ({challenge.tokenType})</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-primary-600 mb-1">
                      <ClockIcon className="h-5 w-5" />
                      <span className="font-bold text-lg">{formatTimeRemaining(challenge.timeRemaining)}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Time Remaining</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-purple-600 mb-1">
                      <UserGroupIcon className="h-5 w-5" />
                      <span className="font-bold text-lg">{challenge.participantCount}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Participants</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-orange-600 mb-1">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span className="font-bold text-lg">{challenge.successfulHacks}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Successful Attacks</p>
                  </div>
                </div>

                {challenge.status === 'Active' && (
                  <div className="flex space-x-4">
                    <Button
                      onClick={() => setShowSubmissionForm(!showSubmissionForm)}
                      leftIcon={<CodeBracketIcon className="h-4 w-4" />}
                    >
                      Submit Attack
                    </Button>
                    <Button
                      variant="outline"
                      leftIcon={<EyeIcon className="h-4 w-4" />}
                    >
                      View Source Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit attack form */}
            {showSubmissionForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Submit Attack Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="label">Attack Code</label>
                        <textarea
                          className="input min-h-[200px] font-mono text-sm"
                          placeholder="Please enter your attack code and detailed description..."
                          value={attackCode}
                          onChange={(e) => setAttackCode(e.target.value)}
                        />
                      </div>
                      <div className="flex space-x-4">
                        <Button
                          onClick={handleSubmitAttack}
                          isLoading={isSubmitting}
                          disabled={!attackCode.trim()}
                        >
                          Submit Attack
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowSubmissionForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Challenge requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Challenge Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {challenge.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Rules and terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />
                  <span>Rules and Terms</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {challenge.rules.map((rule, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-warning-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recent submissions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {challenge.recentAttempts.map((attempt) => (
                    <div key={attempt.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {attempt.hackerNickname}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(attempt.submittedAt, { addSuffix: true, locale: zhCN })}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant={getStatusColor(attempt.status)}>
                            {attempt.status === 'pending' ? 'Under Review' :
                             attempt.status === 'approved' ? 'Approved' : 'Rejected'}
                          </Badge>
                          <Badge variant={getSeverityColor(attempt.severity)}>
                            {attempt.severity === 'critical' ? 'Critical' :
                             attempt.severity === 'high' ? 'High' :
                             attempt.severity === 'medium' ? 'Medium' : 'Low'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        {attempt.description}
                      </p>
                      {attempt.reward > 0 && (
                        <div className="flex items-center space-x-1 text-success-600">
                          <CurrencyDollarIcon className="h-4 w-4" />
                          <span className="font-medium">{attempt.reward.toLocaleString()} {challenge.tokenType}</span>
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
            {/* Technical information */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Contract</label>
                    <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                      {challenge.targetContract}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Source Code</label>
                    <a
                      href={challenge.sourceCode}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary-600 hover:text-primary-700 mt-1"
                    >
                      View GitHub Repository
                    </a>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Documentation</label>
                    <a
                      href={challenge.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary-600 hover:text-primary-700 mt-1"
                    >
                      View Technical Documentation
                    </a>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Test Network</label>
                    <a
                      href={challenge.testnetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary-600 hover:text-primary-700 mt-1"
                    >
                      Access Test Network
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Submissions</span>
                    <span className="font-semibold">{challenge.submissionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Successful Attacks</span>
                    <span className="font-semibold text-success-600">{challenge.successfulHacks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                    <span className="font-semibold">
                      {challenge.submissionCount > 0 
                        ? Math.round((challenge.successfulHacks / challenge.submissionCount) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Participants</span>
                    <span className="font-semibold">{challenge.participantCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company information */}
            <Card>
              <CardHeader>
                <CardTitle>Publisher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {challenge.company.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{challenge.company}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Leading company focused on decentralized finance protocol development
                  </p>
                  <Button variant="outline" size="sm">
                    View Company Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetailPage;