/**
 * @flow
 */

import { Observable } from 'microcosm'
import { castPath, type KeyPath } from './key-path'

import type Microcosm from './microcosm'

type MixedObject = { [key: string]: mixed }

/**
 * Shallow copy an object
 */
export function clone<T: MixedObject>(target: T): $Shape<T> {
  if (Array.isArray(target)) {
    return target.slice(0)
  } else if (isObject(target) === false) {
    return {}
  }

  let copy = {}

  for (var key in target) {
    copy[key] = target[key]
  }

  return copy
}

/**
 * Merge any number of objects into a provided object.
 */
export function merge(...args: Array<?Object>): Object {
  let copy = null
  let subject = null

  for (var i = 0, len = args.length; i < len; i++) {
    if (isObject(args[i]) === false) {
      continue
    }

    copy = copy || args[i] || {}

    subject = subject || copy

    var next = args[i]
    for (var key in next) {
      if (copy[key] !== next[key]) {
        if (copy === subject) {
          copy = clone(subject)
        }

        copy[key] = next[key]
      }
    }
  }

  return copy || {}
}

/**
 * Retrieve a value from an object. If no key is provided, just return
 * the object.
 */
export function get(object: ?Object, keyPath: *, fallback?: *) {
  let path = castPath(keyPath)
  let value = object

  for (var i = 0, len = path.length; i < len; i++) {
    if (value == null) {
      break
    }

    value = value[path[i]]
  }

  if (value === undefined || value === null) {
    return arguments.length <= 2 ? value : fallback
  }

  return value
}

/**
 * Non-destructively assign a value to a provided object at a given key. If the
 * value is the same, don't do anything. Otherwise return a new object.
 */
export function set(object: Object, key: *, value: *): any {
  // Ensure we're working with a key path, like: ['a', 'b', 'c']
  let path = castPath(key)

  let len = path.length

  if (len <= 0) {
    return value
  }

  if (get(object, path) === value) {
    return object
  }

  let root = clone(object)
  let node = root

  // For each key in the path...
  for (var i = 0; i < len; i++) {
    let key = path[i]
    let next = value

    // Are we at the end?
    if (i < len - 1) {
      // No: Check to see if the key is already assigned,
      if (key in node) {
        // If yes, clone that value
        next = clone(node[key])
      } else {
        // Otherwise assign an object so that we can keep drilling down
        next = {}
      }
    }

    // Assign the value, then continue on to the next iteration of the loop
    // using the next step down
    node[key] = next
    node = node[key]
  }

  return root
}

/**
 * Is a value an object?
 */
export function isObject(target: *): boolean {
  return !(!target || typeof target !== 'object')
}

export function isPlainObject(value: *): boolean {
  if (!value || Array.isArray(value)) {
    return false
  }

  return value.constructor === Object
}

/**
 * Is a value a function?
 */
export function isFunction(target: any): boolean {
  return !!target && typeof target === 'function'
}

export function isBlank(value: any): boolean {
  return value === '' || value === null || value === undefined
}

export function createOrClone(target: any, options: ?Object, repo: Microcosm) {
  if (isFunction(target)) {
    return new target(options, repo)
  }

  return Object.create(target)
}

/**
 * A helper combination of get and set
 */
export function update(
  state: *,
  keyPath: string | KeyPath,
  updater: *,
  fallback?: *
) {
  let path = castPath(keyPath)

  if (isFunction(updater) === false) {
    return set(state, path, updater)
  }

  let last = get(state, path, fallback)
  let next = updater(last)

  return set(state, path, next)
}

export function result(target: *, keyPath: string | KeyPath): * {
  let value = get(target, keyPath)

  if (typeof value === 'function') {
    return value.call(target)
  }

  return value
}

export function hasSymbol(name) {
  return typeof Symbol === 'function' && Boolean(Symbol[name])
}

export function getSymbol(name) {
  return hasSymbol(name) ? Symbol[name] : '@@' + name
}

/**
 * Resolve an array of object of observables, preserving the
 * original shape/order.
 */
const updatePair = (pair, value) => {
  pair[1] = value
  return pair
}

const assignPair = (state, pair) => set(state, pair)

export function observerHash(obj) {
  if (isObject(obj)) {
    if (getSymbol('observable') in obj) {
      return obj[getSymbol('observable')]()
    }

    var jobs = Observable.of(...Object.keys(obj))
    var shape = Array.isArray(obj) ? [] : {}
    var pairs = jobs.flatMap(key => obj[key].reduce(updatePair, [key, null]))

    return pairs.reduce(assignPair, shape)
  }

  return Observable.of(obj)
}
