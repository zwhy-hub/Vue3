import { activeSub } from './effect'

enum ReactiveFlags {
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

  //保存和effect 之间的关联关系
  subs

  constructor(value) {
    this._value = value
  }

  get value() {
    //收集依赖
    // console.log('收集依赖', activeSub)
    if (activeSub) {
      // 如果有 收集依赖
      this.subs = activeSub
      // this.subs = this.subs || new Set()
      // this.subs.add(activeSub)
    }
    return this._value
  }

  set value(newValue) {
    //触发依赖
    // console.log('触发依赖')
    this._value = newValue
    //通知effect函数执行
    this.subs?.()
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
