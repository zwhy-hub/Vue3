//用来保存当前正在执行的effect函数
export let activeSub

class ReactiveEffect {
  constructor(public fn) {}

  run() {
    //每次执行fn之前，吧this放在activeSub上
    activeSub = this

    try {
      return this.fn()
    } finally {
      //执行完之后 把active设置成udnefined
      activeSub = undefined
    }
  }
}

export function effect(fn) {
  const e = new ReactiveEffect(fn)
  e.run()
}
