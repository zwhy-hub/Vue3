import type { Link, Sub } from './system'
import { startTrack, endTrack } from './system'

//用来保存当前正在执行的effect函数
export let activeSub

export function setActiveSub(sub) {
  activeSub = sub
}

export class ReactiveEffect implements Sub {
  active = true
  /**
   * 依赖项链表的头节点
   */
  deps: Link | undefined
  /**
   * 依赖项链表的尾节点
   */
  depsTail: Link | undefined

  tracking = false

  dirty = false

  constructor(public fn) {}

  run() {
    if (!this.active) {
      return this.fn()
    }
    const prevSub = activeSub
    //每次执行fn之前，吧this放在activeSub上
    setActiveSub(this)
    //标记为undefined 表示被dep触发了重新执行 要尝试复用link节点
    startTrack(this)
    try {
      return this.fn()
    } finally {
      endTrack(this)
      //执行完之后 把active设置成undefined
      setActiveSub(prevSub)
    }
  }

  notify() {
    this.scheduler()
  }

  scheduler() {
    this.run()
  }

  stop() {
    if (this.active) {
      startTrack(this)
      endTrack(this)
      this.active = false
    }
  }
}

export function effect(fn, options) {
  const e = new ReactiveEffect(fn)
  // scheduler
  Object.assign(e, options)
  e.run()
  /**
   * 绑定this
   */
  const runner = e.run.bind(e)
  /**
   * 把 effect实例放到effect属性中
   */
  runner.effect = e
  return runner
}
