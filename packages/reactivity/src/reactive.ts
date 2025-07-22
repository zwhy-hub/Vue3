import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHandlers'

export function reactive(target) {
  return createReactiveObject(target)
}

/**
 * 保存target和响应式对象之间的关联关系
 * target => proxy
 */
const reactiveMap = new WeakMap()

/**
 * 保存所有reactive创建出来的响应式对象
 */
const reactiveSet = new WeakSet()

function createReactiveObject(target) {
  /**
   * reactive必须接收一个对象
   */
  if (!isObject(target)) {
    return target
  }

  if (reactiveSet.has(target)) {
    return target
  }

  const exitingProxy = reactiveMap.get(target)
  if (exitingProxy) {
    /**
     * 如果该对象创建过响应式对象，返回创建过的
     */
    return exitingProxy
  }

  /**
   * 创建代理对象
   */
  const proxy = new Proxy(target, mutableHandlers)

  /**
   * 保存target和proxy之间关联关系
   */
  reactiveMap.set(target, proxy)

  /**
   * 保存创建过的响应式对象
   */
  reactiveSet.add(proxy)

  return proxy
}

/**
 *
 * @param target 判断是不是响应式对象
 * @returns
 */
export function isReactive(target) {
  return reactiveSet.has(target)
}
