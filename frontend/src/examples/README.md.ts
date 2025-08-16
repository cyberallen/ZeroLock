/**
 * ZeroLock Backend Service 使用示例 README
 * 
 * 这个文件展示了如何在 React 组件中使用完整的服务层
 * 包含了常见的使用模式和最佳实践
 */

/**
 * ## 1. 基本服务初始化
 * 
 * ```tsx
 * import { initializeBackendService, getServiceContainer } from '@/services';
 * import { Identity } from '@dfinity/agent';
 * 
 * // 应用启动时初始化服务
 * const initializeApp = async (identity?: Identity) => {
 *   try {
 *     await initializeBackendService(identity);
 *     console.log('服务初始化成功');
 *   } catch (error) {
 *     console.error('服务初始化失败:', error);
 *   }
 * };
 * ```
 * 
 * ## 2. 使用 React Hooks
 * 
 * ```tsx
 * import React from 'react';
 * import { useBackendService, useApiCall } from '@/services';
 * 
 * const MyComponent: React.FC = () => {
 *   // 管理服务状态
 *   const { service, isInitialized, isLoading, error } = useBackendService();
 *   
 *   // 单次 API 调用
 *   const {
 *     data: stats,
 *     loading: statsLoading,
 *     error: statsError,
 *     execute: loadStats
 *   } = useApiCall(() => {
 *     const services = getServiceContainer();
 *     return services.bountyFactory.getChallengeStats();
 *   });
 *   
 *   // 在组件加载时执行
 *   React.useEffect(() => {
 *     if (isInitialized) {
 *       loadStats();
 *     }
 *   }, [isInitialized, loadStats]);
 *   
 *   if (isLoading) return <div>初始化中...</div>;
 *   if (error) return <div>错误: {error}</div>;
 *   
 *   return (
 *     <div>
 *       {statsLoading && <div>加载统计中...</div>}
 *       {stats && (
 *         <div>
 *           <p>总挑战数: {Number(stats.total)}</p>
 *           <p>活跃挑战: {Number(stats.active)}</p>
 *           <p>已完成: {Number(stats.completed)}</p>
 *         </div>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 * 
 * ## 3. 分页数据处理
 * 
 * ```tsx
 * import { usePaginatedData } from '@/services';
 * 
 * const ChallengeList: React.FC = () => {
 *   const {
 *     data: challenges,
 *     loading,
 *     error,
 *     hasMore,
 *     loadMore,
 *     refresh
 *   } = usePaginatedData(
 *     (offset: number, limit: number) => {
 *       const services = getServiceContainer();
 *       return services.bountyFactory.listChallenges(undefined, offset, limit);
 *     },
 *     { limit: 10 }
 *   );
 * 
 *   return (
 *     <div>
 *       {challenges.map(challenge => (
 *         <div key={Number(challenge.id)}>
 *           挑战 #{Number(challenge.id)}
 *         </div>
 *       ))}
 *       {hasMore && (
 *         <button onClick={loadMore} disabled={loading}>
 *           加载更多
 *         </button>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 * 
 * ## 4. 错误处理
 * 
 * ```tsx
 * import { 
 *   isApiSuccess, 
 *   formatErrorMessage, 
 *   showErrorNotification 
 * } from '@/services';
 * 
 * const handleOperation = async () => {
 *   const services = getServiceContainer();
 *   
 *   try {
 *     const response = await services.bountyFactory.getChallenge(1);
 *     
 *     if (isApiSuccess(response)) {
 *       console.log('挑战数据:', response.data);
 *     } else {
 *       const errorMsg = formatErrorMessage(response.error);
 *       showErrorNotification(errorMsg);
 *     }
 *   } catch (error) {
 *     const errorMsg = formatErrorMessage(error);
 *     showErrorNotification(errorMsg);
 *   }
 * };
 * ```
 * 
 * ## 5. 创建挑战示例
 * 
 * ```tsx
 * const createChallenge = async () => {
 *   const services = getServiceContainer();
 *   
 *   const request = {
 *     description: '测试挑战',
 *     bounty_amount: BigInt(1000000000), // 10 ICP (以 e8s 为单位)
 *     token_type: { 'ICP': null },
 *     difficulty_level: 5,
 *     duration_hours: BigInt(24 * 7), // 一周
 *     candid_interface: 'service : { hello : () -> (text) }',
 *     wasm_code: new Uint8Array([0x00, 0x61, 0x73, 0x6d]) // WASM 魔数
 *   };
 *   
 *   const response = await services.bountyFactory.createChallenge(request);
 *   
 *   if (isApiSuccess(response)) {
 *     console.log('挑战创建成功，ID:', response.data);
 *   } else {
 *     console.error('创建失败:', response.error);
 *   }
 * };
 * ```
 * 
 * ## 6. 余额查询示例
 * 
 * ```tsx
 * import { Principal } from '@dfinity/principal';
 * import { safeBigIntToNumber } from '@/services';
 * 
 * const checkBalance = async (userPrincipal: Principal) => {
 *   const services = getServiceContainer();
 *   
 *   // 获取 ICP 余额
 *   const response = await services.vault.getBalance(
 *     userPrincipal, 
 *     { 'ICP': null }
 *   );
 *   
 *   if (isApiSuccess(response)) {
 *     const balance = response.data;
 *     console.log('总额:', safeBigIntToNumber(balance.total) / 100_000_000, 'ICP');
 *     console.log('可用:', safeBigIntToNumber(balance.available) / 100_000_000, 'ICP');
 *     console.log('锁定:', safeBigIntToNumber(balance.locked) / 100_000_000, 'ICP');
 *   }
 * };
 * ```
 * 
 * ## 7. 批量操作示例
 * 
 * ```tsx
 * const batchUpdateChallenges = async () => {
 *   const services = getServiceContainer();
 *   
 *   const updates = [
 *     { id: 1, status: { 'Completed': null } },
 *     { id: 2, status: { 'Expired': null } }
 *   ];
 *   
 *   const response = await services.bountyFactory.batchUpdateChallengeStatus(updates);
 *   
 *   if (isApiSuccess(response)) {
 *     console.log('批量更新结果:', response.data);
 *   }
 * };
 * ```
 * 
 * ## 8. 实用工具函数
 * 
 * ```tsx
 * import { 
 *   formatPrincipal, 
 *   safeBigIntToNumber,
 *   validatePaginationParams 
 * } from '@/services';
 * 
 * // 格式化 Principal 显示
 * const principal = Principal.fromText('rdmx6-jaaaa-aaaaa-aaadq-cai');
 * console.log(formatPrincipal(principal)); // "rdmx6-...adq-cai"
 * 
 * // 安全转换 BigInt
 * const amount = BigInt(1000000000);
 * console.log(safeBigIntToNumber(amount)); // 1000000000
 * 
 * // 验证分页参数
 * try {
 *   validatePaginationParams(0, 10); // 通过
 *   validatePaginationParams(-1, 10); // 抛出错误
 * } catch (error) {
 *   console.error('分页参数无效:', error.message);
 * }
 * ```
 * 
 * ## 9. 服务容器管理
 * 
 * ```tsx
 * import { 
 *   getServiceContainer, 
 *   getBountyFactoryService, 
 *   getVaultService,
 *   cleanupServiceContainer,
 *   reinitializeServices 
 * } from '@/services';
 * 
 * // 获取完整服务容器
 * const services = getServiceContainer();
 * 
 * // 获取特定服务
 * const bountyFactory = getBountyFactoryService();
 * const vault = getVaultService();
 * 
 * // 重新初始化（用户登录后）
 * const onUserLogin = async (identity: Identity) => {
 *   await reinitializeServices(identity);
 * };
 * 
 * // 清理服务（用户登出时）
 * const onUserLogout = () => {
 *   cleanupServiceContainer();
 * };
 * ```
 * 
 * ## 10. 类型安全使用
 * 
 * ```tsx
 * import type { 
 *   Challenge, 
 *   ChallengeStatus, 
 *   TokenType,
 *   Balance,
 *   ApiResponse 
 * } from '@/services';
 * 
 * // 类型守卫
 * const handleChallengeResponse = (response: ApiResponse<Challenge[]>) => {
 *   if (response.success) {
 *     // TypeScript 知道 response.data 是 Challenge[]
 *     response.data.forEach(challenge => {
 *       console.log(`挑战 ${Number(challenge.id)}: ${challenge.description}`);
 *     });
 *   } else {
 *     // TypeScript 知道 response.error 是 string
 *     console.error('获取挑战失败:', response.error);
 *   }
 * };
 * ```
 */

export const SERVICE_USAGE_EXAMPLES = {
  INITIALIZATION: '服务初始化示例',
  REACT_HOOKS: 'React Hooks 使用示例',
  PAGINATION: '分页数据处理示例',
  ERROR_HANDLING: '错误处理示例',
  CREATE_CHALLENGE: '创建挑战示例',
  BALANCE_QUERY: '余额查询示例',
  BATCH_OPERATIONS: '批量操作示例',
  UTILITY_FUNCTIONS: '实用工具函数示例',
  SERVICE_CONTAINER: '服务容器管理示例',
  TYPE_SAFETY: '类型安全使用示例'
};
