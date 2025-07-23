import { activeSub } from './effect'
import { Link, link, propagate } from './system'
import { isReactive, reactive } from './reactive'
import { hasChanged } from '@vue/shared'

export enum ReactiveFlags {
  IS_REF = '__v_isRef',
}

/**
 * Ref 得类
 */
class RefImpl {
  //保存实际的值
  _value;

  //ref标记 证明是一个ref
  [ReactiveFlags.IS_REF] = true

  /**
   * 订阅者链表的头节点,head
   */
  subs: Link
  /**
   *
   * 订阅者链表的尾节点 理解为tail
   */
  subsTail: Link

  constructor(value) {
    this._value = isReactive(value) ? reactive(value) : value
  }

  get value() {
    //收集依赖
    // console.log('收集依赖', activeSub)
    if (activeSub) {
      trackRef(this)
    }
    return this._value
  }

  set value(newValue) {
    /**
     * 只有newValue不等于oldValue才更新
     */
    if (hasChanged(newValue, this._value)) {
      this._value = isReactive(newValue) ? reactive(newValue) : newValue
      //通知effect函数执行
      triggerRef(this)
    }
  }
}

export function ref(value) {
  return new RefImpl(value)
}
/**
 * 判断是不是一个ref
 */
export function isRef(value) {
  return !!(value && value[ReactiveFlags.IS_REF])
}

/**
 * 收集依赖，建立ref和effect之间的链表关系
 * @param dep
 */
export function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 关联的effect重新执行
 * @param dep
 *
 */
export function triggerRef(dep) {
  if (dep.subs) {
    propagate(dep.subs)
  }
}
