/**
 * ZeroLock 服务使用的简单示例
 * 展示如何正确使用后端服务层
 */

import React, { useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import {
  useBackendService,
  useApiCall,
  getServiceContainer,
  formatPrincipal,
  safeBigIntToNumber
} from '@/services';

/**
 * 挑战统计展示组件
 */
export const ChallengeStatsExample: React.FC = () => {
  const { isInitialized, isLoading, error } = useBackendService();

  // 获取挑战统计
  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    execute: loadStats
  } = useApiCall(() => {
    const services = getServiceContainer();
    return services.bountyFactory.getChallengeStats();
  });

  useEffect(() => {
    if (isInitialized) {
      loadStats();
    }
  }, [isInitialized, loadStats]);

  if (isLoading) {
    return <div>正在初始化服务...</div>;
  }

  if (error) {
    return <div>服务初始化失败: {error}</div>;
  }

  return (
    <div className="challenge-stats">
      <h2>挑战统计</h2>
      
      {statsLoading ? (
        <div>加载统计中...</div>
      ) : statsError ? (
        <div>加载失败: {statsError}</div>
      ) : stats ? (
        <div className="stats-grid">
          <div className="stat-item">
            <h3>总挑战数</h3>
            <p>{safeBigIntToNumber(stats.total)}</p>
          </div>
          <div className="stat-item">
            <h3>活跃挑战</h3>
            <p>{safeBigIntToNumber(stats.active)}</p>
          </div>
          <div className="stat-item">
            <h3>已完成</h3>
            <p>{safeBigIntToNumber(stats.completed)}</p>
          </div>
          <div className="stat-item">
            <h3>已过期</h3>
            <p>{safeBigIntToNumber(stats.expired)}</p>
          </div>
          <div className="stat-item">
            <h3>已取消</h3>
            <p>{safeBigIntToNumber(stats.cancelled)}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/**
 * 用户余额查询示例
 */
export const BalanceExample: React.FC<{ userPrincipal?: Principal }> = ({ 
  userPrincipal = Principal.fromText('rdmx6-jaaaa-aaaaa-aaadq-cai') 
}) => {
  const { isInitialized } = useBackendService();

  // 获取 ICP 余额
  const {
    data: icpBalance,
    loading: balanceLoading,
    error: balanceError,
    execute: loadBalance
  } = useApiCall(() => {
    const services = getServiceContainer();
    return services.vault.getBalance(userPrincipal, { 'ICP': null });
  });

  useEffect(() => {
    if (isInitialized) {
      loadBalance();
    }
  }, [isInitialized, loadBalance]);

  return (
    <div className="balance-example">
      <h2>用户余额</h2>
      <p><strong>用户:</strong> {formatPrincipal(userPrincipal)}</p>
      
      {balanceLoading ? (
        <div>加载余额中...</div>
      ) : balanceError ? (
        <div>获取余额失败: {balanceError}</div>
      ) : icpBalance ? (
        <div className="balance-info">
          <div className="balance-item">
            <strong>总计:</strong> {safeBigIntToNumber(icpBalance.total) / 100_000_000} ICP
          </div>
          <div className="balance-item">
            <strong>可用:</strong> {safeBigIntToNumber(icpBalance.available) / 100_000_000} ICP
          </div>
          <div className="balance-item">
            <strong>锁定:</strong> {safeBigIntToNumber(icpBalance.locked) / 100_000_000} ICP
          </div>
        </div>
      ) : null}
    </div>
  );
};

/**
 * 挑战列表示例
 */
export const ChallengeListExample: React.FC = () => {
  const { isInitialized } = useBackendService();

  const {
    data: challenges,
    loading: challengesLoading,
    error: challengesError,
    execute: loadChallenges
  } = useApiCall(() => {
    const services = getServiceContainer();
    return services.bountyFactory.listChallenges(undefined, 0, 10);
  });

  useEffect(() => {
    if (isInitialized) {
      loadChallenges();
    }
  }, [isInitialized, loadChallenges]);

  return (
    <div className="challenge-list">
      <h2>最新挑战</h2>
      
      {challengesLoading ? (
        <div>加载挑战列表中...</div>
      ) : challengesError ? (
        <div>获取挑战列表失败: {challengesError}</div>
      ) : challenges && challenges.length > 0 ? (
        <div className="challenges">
          {challenges.slice(0, 5).map((challenge) => (
            <div key={Number(challenge.id)} className="challenge-item">
              <h3>挑战 #{Number(challenge.id)}</h3>
              <p><strong>状态:</strong> {Object.keys(challenge.status)[0]}</p>
              <p><strong>公司:</strong> {formatPrincipal(challenge.company)}</p>
              <p><strong>奖励:</strong> {safeBigIntToNumber(challenge.bounty_amount) / 100_000_000} {Object.keys(challenge.token_type)[0]}</p>
              <p><strong>难度:</strong> {'★'.repeat(challenge.difficulty_level)}</p>
              <p><strong>描述:</strong> {challenge.description.substring(0, 100)}...</p>
            </div>
          ))}
        </div>
      ) : (
        <div>暂无挑战</div>
      )}
    </div>
  );
};

/**
 * 管理员功能示例
 */
export const AdminExample: React.FC = () => {
  const { isInitialized } = useBackendService();

  const {
    data: admins,
    loading: adminsLoading,
    error: adminsError,
    execute: loadAdmins
  } = useApiCall(() => {
    const services = getServiceContainer();
    return services.bountyFactory.getAdmins();
  });

  useEffect(() => {
    if (isInitialized) {
      loadAdmins();
    }
  }, [isInitialized, loadAdmins]);

  return (
    <div className="admin-example">
      <h2>平台管理员</h2>
      
      {adminsLoading ? (
        <div>加载管理员列表中...</div>
      ) : adminsError ? (
        <div>获取管理员列表失败: {adminsError}</div>
      ) : admins && admins.length > 0 ? (
        <div className="admins-list">
          {admins.map((admin, index) => (
            <div key={index} className="admin-item">
              <strong>管理员 {index + 1}:</strong> {formatPrincipal(admin)}
            </div>
          ))}
        </div>
      ) : (
        <div>暂无管理员</div>
      )}
    </div>
  );
};

/**
 * 综合示例应用
 */
export const ServiceExampleApp: React.FC = () => {
  return (
    <div className="service-example-app">
      <h1>ZeroLock 服务层使用示例</h1>
      
      <div className="examples-grid">
        <section>
          <ChallengeStatsExample />
        </section>
        
        <section>
          <BalanceExample />
        </section>
        
        <section>
          <ChallengeListExample />
        </section>
        
        <section>
          <AdminExample />
        </section>
      </div>
      
      <div className="example-info">
        <h3>使用说明</h3>
        <ul>
          <li>这些示例展示了如何使用 ZeroLock 服务层</li>
          <li>所有组件都使用 useBackendService 和 useApiCall hooks</li>
          <li>错误处理和加载状态都已正确处理</li>
          <li>数据类型都与实际的 Candid 定义匹配</li>
        </ul>
        
        <h3>集成步骤</h3>
        <ol>
          <li>确保用户已通过 Internet Identity 登录</li>
          <li>调用 initializeBackendService(identity) 初始化服务</li>
          <li>使用 getServiceContainer() 获取服务实例</li>
          <li>通过服务实例调用各种 API 方法</li>
        </ol>
      </div>
    </div>
  );
};
