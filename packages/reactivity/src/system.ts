import { ReactiveEffect } from './effect'

/**
 * 依赖项
 */
export interface Dep {
  /**
   * 订阅者链表头节点
   */
  subs: Link | undefined
  subsTail: Link | undefined
}

/**
 * 订阅者
 */
export interface Sub {
  deps: Link | undefined
  depsTail: Link | undefined
}
export interface Link {
  //订阅者
  sub: Sub
  //下一个订阅者节点
  nextSub: Link | undefined
  //上一个订阅者节点
  prevSub: Link | undefined
  //依赖项
  dep: Dep
  //下一个依赖项节点
  nextDep: Link | undefined
}

/**
 * 链接链表关系
 * @param dep
 * @param sub
 */

export function link(dep, sub) {
  //复用链表依赖
  const currentDep = sub.depsTail
  /**
   * 如果头节点有，尾节点没有，尝试复用头节点
   * 如果头节点有，尾节点也有，尝试复用nextDep
   */
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }

  const newLink = {
    sub,
    dep,
    nextSub: undefined,
    prevSub: undefined,
    nextDep,
  }

  //将链表节点与dep建立关系
  /**
   * 关联链表关系 分两种情况
   * 1.尾节点有，往尾节点后面加
   * 2.尾节点没有，第一次加，加到头节点
   */
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = newLink
    dep.subsTail = newLink
  }

  //将链表节点与sub建立关系
  /**
   * 关联链表关系 分两种情况
   * 1.尾节点有，往尾节点后面加
   * 2.尾节点没有，第一次加，加到头节点
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = newLink
    sub.depsTail = newLink
  }
}

/**
 * 传播更新
 * @param subs
 */
export function propagate(subs) {
  let link = subs
  let queuedEffect = []
  while (link) {
    queuedEffect.push(link.sub)
    link = link.nextSub
  }
  queuedEffect.forEach(effect => effect.notify())
}

/**
 *
 * @param sub 开始追踪依赖，将depsTail设置为undefined
 */
export function startTrack(sub) {
  sub.depsTail = undefined
}

/**
 *
 * @param sub 结束追踪，找到需要清理的依赖，断开关联关系
 */
export function endTrack(sub) {
  const depsTail = sub.depsTail
  /**
   * 如果depsTail有，并且depsTail还有nextDep,清除依赖关系
   * 如果depsTail没有，头节点有，全部清除
   */
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep)
      depsTail.nextDep = undefined
    }
  } else if (sub.deps) {
    clearTracking(sub.deps)
    sub.deps = undefined
  }
}

/**
 *
 * @param link 清除依赖
 */
export function clearTracking(link: Link) {
  while (link) {
    const { prevSub, nextSub, nextDep, dep } = link

    /**
     * 如果prevSub 有 prevSub.nextSub指向nextSub
     * 如果没有，是头节点，把dep.subs指向nextSub
     */
    if (prevSub) {
      prevSub.nextSub = nextSub
      link.nextSub = undefined
    } else {
      dep.subs = nextSub
    }

    /**
     * 如果nextSub有，把nextSub.prevSub指向上一个
     *如果下一个没有，是尾节点，把subsTail指向上一个
     */
    if (nextSub) {
      nextSub.prevSub = prevSub
      link.prevSub = undefined
    } else {
      dep.subsTail = prevSub
    }

    link.dep = link.sub = undefined
    link.nextDep = undefined
    link = nextDep
  }
}
