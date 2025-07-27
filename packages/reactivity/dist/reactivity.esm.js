// packages/reactivity/src/system.ts
var linkPool;
function link(dep, sub) {
  const currentDep = sub.depsTail;
  const nextDep = currentDep === void 0 ? sub.deps : currentDep.nextDep;
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep;
    return;
  }
  let newLink;
  if (linkPool) {
    newLink = linkPool;
    linkPool = linkPool.nextDep;
    newLink.nextDep = nextDep;
    newLink.dep = dep;
    newLink.sub = sub;
  } else {
    newLink = {
      sub,
      dep,
      nextSub: void 0,
      prevSub: void 0,
      nextDep
    };
  }
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink;
    newLink.prevSub = dep.subsTail;
    dep.subsTail = newLink;
  } else {
    dep.subs = newLink;
    dep.subsTail = newLink;
  }
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink;
    sub.depsTail = newLink;
  } else {
    sub.deps = newLink;
    sub.depsTail = newLink;
  }
}
function processComputedUpdate(sub) {
  sub.update();
  propagate(sub.subs);
}
function propagate(subs) {
  let link3 = subs;
  let queuedEffect = [];
  while (link3) {
    const sub = link3.sub;
    if (!sub.tracking) {
      if ("update" in sub) {
        processComputedUpdate(sub);
      } else {
        queuedEffect.push(sub);
      }
    }
    link3 = link3.nextSub;
  }
  queuedEffect.forEach((effect2) => effect2.notify());
}
function startTrack(sub) {
  sub.depsTail = void 0;
  sub.tracking = true;
}
function endTrack(sub) {
  sub.tracking = false;
  const depsTail = sub.depsTail;
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep);
      depsTail.nextDep = void 0;
    }
  } else if (sub.deps) {
    clearTracking(sub.deps);
    sub.deps = void 0;
  }
}
function clearTracking(link3) {
  while (link3) {
    const { prevSub, nextSub, nextDep, dep } = link3;
    if (prevSub) {
      prevSub.nextSub = nextSub;
      link3.nextSub = void 0;
    } else {
      dep.subs = nextSub;
    }
    if (nextSub) {
      nextSub.prevSub = prevSub;
      link3.prevSub = void 0;
    } else {
      dep.subsTail = prevSub;
    }
    link3.dep = link3.sub = void 0;
    link3.nextDep = linkPool;
    linkPool = link3;
    link3 = nextDep;
  }
}

// packages/reactivity/src/effect.ts
var activeSub;
function setActiveSub(sub) {
  activeSub = sub;
}
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  /**
   * 依赖项链表的头节点
   */
  deps;
  /**
   * 依赖项链表的尾节点
   */
  depsTail;
  tracking = false;
  run() {
    const prevSub = activeSub;
    setActiveSub(this);
    startTrack(this);
    try {
      return this.fn();
    } finally {
      endTrack(this);
      setActiveSub(prevSub);
    }
  }
  notify() {
    this.scheduler();
  }
  scheduler() {
    this.run();
  }
};
function effect(fn, options) {
  const e = new ReactiveEffect(fn);
  Object.assign(e, options);
  e.run();
  const runner = e.run.bind(e);
  runner.effect = e;
  return runner;
}

// packages/shared/src/index.ts
function isObject(obj) {
  return obj !== null && typeof obj === "object";
}
function hasChanged(oldValue, newValue) {
  return !Object.is(oldValue, newValue);
}
function isFunction(value) {
  return typeof value === "function";
}

// packages/reactivity/src/dep.ts
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (!activeSub) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = /* @__PURE__ */ new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Dep();
    depsMap.set(key, dep);
  }
  link(dep, activeSub);
}
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  if (!dep) {
    return;
  }
  propagate(dep.subs);
}
var Dep = class {
  /**
   * 订阅者链表的头节点,head
   */
  subs;
  /**
   *
   * 订阅者链表的尾节点 理解为tail
   */
  subsTail;
  constructor() {
  }
};

// packages/reactivity/src/baseHandlers.ts
var mutableHandlers = {
  get(target, key, receiver) {
    track(target, key);
    const res = Reflect.get(target, key, receiver);
    if (isRef(res)) {
      return res.value;
    }
    if (isObject(res)) {
      return reactive(res);
    }
    return Reflect.get(target, key, receiver);
  },
  set(target, key, newValue, receiver) {
    const oldValue = target[key];
    const res = Reflect.set(target, key, newValue, receiver);
    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue;
      return res;
    }
    if (hasChanged(oldValue, newValue)) {
      trigger(target, key);
    }
    return res;
  }
};

// packages/reactivity/src/reactive.ts
function reactive(target) {
  return createReactiveObject(target);
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
var reactiveSet = /* @__PURE__ */ new WeakSet();
function createReactiveObject(target) {
  if (!isObject(target)) {
    return target;
  }
  if (reactiveSet.has(target)) {
    return target;
  }
  const exitingProxy = reactiveMap.get(target);
  if (exitingProxy) {
    return exitingProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  reactiveSet.add(proxy);
  return proxy;
}
function isReactive(target) {
  return reactiveSet.has(target);
}

// packages/reactivity/src/ref.ts
var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
  ReactiveFlags2["IS_REF"] = "__v_isRef";
  return ReactiveFlags2;
})(ReactiveFlags || {});
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
    this._value = isReactive(value) ? reactive(value) : value;
  }
  get value() {
    if (activeSub) {
      trackRef(this);
    }
    return this._value;
  }
  set value(newValue) {
    if (hasChanged(newValue, this._value)) {
      this._value = isReactive(newValue) ? reactive(newValue) : newValue;
      triggerRef(this);
    }
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

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  constructor(fn, setter) {
    this.fn = fn;
    this.setter = setter;
  }
  //computed也是一个ref
  ["__v_isRef" /* IS_REF */] = true;
  //保存fn的返回值
  _value;
  //作为dep
  /**
   * 订阅者链表的头节点,head
   */
  subs;
  /**
   *
   * 订阅者链表的尾节点 理解为tail
   */
  subsTail;
  //作为sub
  /**
   * 依赖项链表的头节点
   */
  deps;
  /**
   * 依赖项链表的尾节点
   */
  depsTail;
  tracking = false;
  get value() {
    this.update();
    return this._value;
  }
  set value(newValue) {
    if (this.setter) {
      this.setter(newValue);
    } else {
      console.warn("no");
    }
  }
  update() {
    const prevSub = activeSub;
    setActiveSub(this);
    startTrack(this);
    try {
      this._value = this.fn();
    } finally {
      endTrack(this);
      setActiveSub(prevSub);
    }
    this._value = this.fn();
  }
};
function computed(getterOrOptions) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
export {
  ReactiveEffect,
  ReactiveFlags,
  activeSub,
  computed,
  effect,
  isReactive,
  isRef,
  reactive,
  ref,
  setActiveSub,
  trackRef,
  triggerRef
};
//# sourceMappingURL=reactivity.esm.js.map
