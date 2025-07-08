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
    nextDep: undefined,
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
