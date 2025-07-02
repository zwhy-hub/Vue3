//用来保存当前正在执行的effect函数
export let activeSub

export class ReactiveEffect {
  constructor(public fn) {}

  run() {
    const prevSub = activeSub

    //每次执行fn之前，吧this放在activeSub上
    activeSub = this

    try {
      return this.fn()
    } finally {
      //执行完之后 把active设置成undefined
      activeSub = prevSub
    }
  }

  notify() {
    this.scheduler()
  }

  scheduler() {
    this.run
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
