export function isObject(obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * 判断值有没有发生过变化，如果发生过返回true
 * @param oldValue
 * @param newValue
 * @returns
 */
export function hasChanged(oldValue, newValue) {
  return !Object.is(oldValue, newValue)
}

export function isFunction(value) {
  return typeof value === 'function'
}
