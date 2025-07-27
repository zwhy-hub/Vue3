import { ReactiveEffect } from './effect'
import { isRef } from './ref'

export function watch(source, cb, options) {
  const { immediate, once, deep } = options || {}

  if (once) {
    const _cb = cb
    cb = (...args) => {
      _cb(...args)
      stop()
    }
  }

  let getter

  if (isRef(source)) {
    getter = () => source.value
  }

  let oldValue

  function job() {
    //执行effect.run拿到getter的返回值，不能直接执行getter 因为要收集依赖
    const newValue = effect.run()
    //执行用户回调
    cb(newValue, oldValue)
    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter)

  effect.scheduler = job

  if (immediate) {
    job()
  } else {
    //拿到oldValue,并且收集依赖
    oldValue = effect.run()
  }

  function stop() {
    effect.stop()
  }

  return stop
}
