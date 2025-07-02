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
}

export function effect(fn) {
  const e = new ReactiveEffect(fn)
  e.run()
}
