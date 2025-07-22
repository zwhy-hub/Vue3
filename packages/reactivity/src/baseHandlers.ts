import { hasChanged, isObject } from '@vue/shared'
import { track, trigger } from './dep'
import { isRef } from './ref'
import { reactive } from './reactive'

export const mutableHandlers = {
  get(target, key, receiver) {
    /**
     * 收集依赖，绑定target中某个key和sub的联系
     */

    track(target, key)

    const res = Reflect.get(target, key, receiver)

    if (isRef(res)) {
      return res.value
    }

    if (isObject(res)) {
      return reactive(res)
    }

    /**
     * receiver 用来保证访问器里面的this指向代理对象
     */
    return Reflect.get(target, key, receiver)
  },

  set(target, key, newValue, receiver) {
    const oldValue = target[key]
    /**
     *触发更新，set的时候通知之前收集的依赖重新执行
     */

    const res = Reflect.set(target, key, newValue, receiver)

    /**
     * 如果更新之前是一个ref，那么会修改原来的值
     * 如果不是continue
     */
    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue
      return res
    }

    if (hasChanged(oldValue, newValue)) {
      trigger(target, key)
    }

    return res
  },
}
