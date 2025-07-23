import { activeSub, ReactiveEffect, setActiveSub } from './effect'
import { isFunction } from '@vue/shared'
import { ReactiveFlags } from './ref'
import { Dependency, endTrack, link, startTrack, Sub } from './system'

class ComputedRefImpl implements Dependency, Sub {
  //computed也是一个ref
  [ReactiveFlags.IS_REF] = true

  //保存fn的返回值
  _value

  //作为dep
  /**
   * 订阅者链表的头节点,head
   */
  subs: Link
  /**
   *
   * 订阅者链表的尾节点 理解为tail
   */
  subsTail: Link

  //作为sub
  /**
   * 依赖项链表的头节点
   */
  deps: Link | undefined
  /**
   * 依赖项链表的尾节点
   */
  depsTail: Link | undefined

  tracking = false

  constructor(
    public fn, //getter
    private setter,
  ) {}

  get value() {
    this.update()
    /**
     * 和sub建立关联关系
     */
    if (activeSub) {
      link(this, activeSub)
    }
    return this._value
  }

  set value(newValue) {
    if (this.setter) {
      this.setter(newValue)
    } else {
      console.warn('no')
    }
  }

  update() {
    /**
     * 实现sub的功能，执行fn期间，收集fn执行过程中访问到的响应式数据
     * 建立dep与sub的联系
     */
    const prevSub = activeSub
    //每次执行fn之前，吧this放在activeSub上
    setActiveSub(this)
    //标记为undefined 表示被dep触发了重新执行 要尝试复用link节点
    startTrack(this)
    try {
      this._value = this.fn()
    } finally {
      endTrack(this)
      //执行完之后 把active设置成undefined
      setActiveSub(prevSub)
    }
    this._value = this.fn()
  }
}

/**
 * 计算属性
 * @param getterOrOptions 有可能是函数，也可能是对象对象有get和set
 */
export function computed(getterOrOptions) {
  let getter
  let setter

  if (isFunction(getterOrOptions)) {
    /**
     * computed(()=>{})
     */
    getter = getterOrOptions
  } else {
    /**
     * computed({
     * get()
     * set()
     * })
     */
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
