// packages/reactivity/src/effect.ts
var activeSub;
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  run() {
    activeSub = this;
    try {
      return this.fn();
    } finally {
      activeSub = void 0;
    }
  }
};
function effect(fn) {
  const e = new ReactiveEffect(fn);
  e.run();
}

// packages/reactivity/src/system.ts
function link(dep, sub) {
  const newLink = {
    sub,
    nextSub: void 0,
    prevSub: void 0
  };
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink;
    newLink.prevSub = dep.subsTail;
    dep.subsTail = newLink;
  } else {
    dep.subs = newLink;
    dep.subsTail = newLink;
  }
}
function propagate(subs) {
  let link2 = subs;
  let queuedEffect = [];
  while (link2) {
    queuedEffect.push(link2.sub);
    link2 = link2.nextSub;
  }
  queuedEffect.forEach((effect2) => effect2.run());
}

// packages/reactivity/src/ref.ts
var RefImpl = class {
  //保存实际的值
  _value;
  //ref标记 证明是一个ref
  ["__v_isRef" /* IS_REF */] = true;
  /**
   * 订阅者链表的头节点,head
   */
  subs;
  /**
   *
   * 订阅者链表的尾节点 理解为tail
   */
  subsTail;
  constructor(value) {
    this._value = value;
  }
  get value() {
    if (activeSub) {
      trackRef(this);
    }
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    triggerRef(this);
  }
};
function ref(value) {
  return new RefImpl(value);
}
function isRef(value) {
  return !!(value && value["__v_isRef" /* IS_REF */]);
}
function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub);
  }
}
function triggerRef(dep) {
  if (dep.subs) {
    propagate(dep.subs);
  }
}
export {
  activeSub,
  effect,
  isRef,
  ref,
  trackRef,
  triggerRef
};
//# sourceMappingURL=reactivity.esm.js.map
