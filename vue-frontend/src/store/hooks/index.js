export { useActivity } from './useActivity'
export { useUser } from './useUser'
export { useRegistration } from './useRegistration'
export { usePayment } from './usePayment'
export { useSystem } from './useSystem'
export { useDanmu } from './useDanmu'

/**
 * 组合使用多个hooks的示例
 * 
 * ```js
 * import { useActivity, useUser, useRegistration } from '@/store/hooks'
 * 
 * export default {
 *   setup() {
 *     // 获取活动相关状态和方法
 *     const activity = useActivity()
 *     
 *     // 获取用户相关状态和方法
 *     const user = useUser()
 *     
 *     // 获取注册相关方法
 *     const registration = useRegistration()
 *     
 *     // 组合使用
 *     const loadAllData = async () => {
 *       await Promise.all([
 *         activity.loadStats(),
 *         registration.loadParticipants(),
 *         registration.loadOrders()
 *       ])
 *       
 *       activity.checkActivityEnd()
 *     }
 *     
 *     return {
 *       // 返回需要的状态和方法
 *       ...
 *     }
 *   }
 * }
 * ```
 */ 