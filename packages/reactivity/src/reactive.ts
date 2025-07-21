import { activeSub } from './effect'
import { link, propagate } from './system'
import type { Link } from './system'
import { isObject } from '@vue/shared'

export function reactive(target) {
  return createReactiveObject(target)
}

function createReactiveObject(target) {
  /**
   * reactive必须接收一个对象
   */
  if (!isObject(target)) {
    return
  }

  /**
   * 创建代理对象
   */
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      /**
       * 收集依赖，绑定target中某个key和sub的联系
       */

      track(target, key)
      return Reflect.get(target, key)
    },

    set(target, key, newValue, receiver) {
      /**
       *触发更新，set的时候通知之前收集的依赖重新执行
       */

      const res = Reflect.set(target, key, newValue)

      trigger(target, key)
      return res
    },
  })

  return proxy
}

/**
 * 绑定target的key关联的所有Dep
 */
const targetMap = new WeakMap()

function track(target, key) {
  if (!activeSub) {
    return
  }

  let depsMap = targetMap.get(target)

  if (!depsMap) {
    /**
     * 如果没有depsMap，说明之前没收集过任何这个对象的key
     * 创建一个新的，保存target和depsMap之间的关系
     */
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  /**
   * 找dep
   */
  let dep = depsMap.get(key)

  if (!dep) {
    /**
     * 第一次收集这个对象，创建新的
     */
    dep = new Dep()
    depsMap.set(key, dep)
  }

  link(dep, activeSub)
  console.log('dep', dep)
}

function trigger(target, key) {
  /**
   * 找depsMap
   */
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    /**
     * 该对象没有任何属性在sub中访问过
     */
    return
  }

  /**
   * 找到key对应的dep
   */
  const dep = depsMap.get(key)
  if (!dep) {
    //这个key没有在sub中访问过
    return
  }

  propagate(dep.subs)
}

class Dep {
  /**
   * 订阅者链表的头节点,head
   */
  subs: Link
  /**
   *
   * 订阅者链表的尾节点 理解为tail
   */
  subsTail: Link
  constructor() {}
}
