// @flow

import { Subject } from './subject'
import { Tree } from './data'
import { getSymbol } from './symbols'
import { tag } from './tag'
import coroutine from './coroutine'

class History {
  constructor(options) {
    this.root = null
    this.head = null
    this.updates = new Subject()
    this._branch = new Set()
    this._tree = new Tree()
    this._debug = options ? options.debug : false
  }

  get size() {
    return this._branch.size
  }

  then(pass?: *, fail?: *): Promise<*> {
    return Promise.all(this)
  }

  archive() {
    while (this.size > 1 && this.root.closed) {
      let last = this.root
      let next = this._tree.after(this.root)

      if (next && next.closed) {
        // Delete the action from the active list to prevent
        // dispatch
        this._branch.delete(last)
        this.remove(last)
      } else {
        break
      }
    }
  }

  append(origin, command, ...params) {
    let action = new Subject(params[0], { tag: '' + tag(command), origin })

    this._branch.add(action)

    if (this.head) {
      this._tree.point(this.head, action)
    } else {
      this.root = action
    }

    this.head = action

    this.updates.next(action)

    if (this._debug === false) {
      action.subscribe({
        cleanup: this.archive.bind(this, action)
      })
    }

    try {
      coroutine(action, command, params, origin)
    } catch (x) {
      action.error(x)
      throw x
    }

    return action
  }

  before(action) {
    return this._tree.before(action)
  }

  after(action) {
    return action === this.head ? undefined : this._tree.after(action)
  }

  wait() {
    return this.then()
  }

  remove(action) {
    let isActive = this.isActive(action)

    if (this.head === action) {
      this.head = this.before(action)
    }

    let base = this._tree.remove(action)

    if (this.root === action) {
      this.root = base
    }

    if (isActive && base) {
      this._branch.delete(action)
      this.updates.next(base)
    }
  }

  isActive(action) {
    return !action.disabled && this._branch.has(action)
  }

  toggle(action) {
    action.toggle()

    if (this._branch.has(action)) {
      this.updates.next(action)
    }
  }

  checkout(action) {
    if (!action) {
      throw new Error(`Unable to checkout ${action} action`)
    }

    this.head = action
    this._branch = new Set(this._tree.select(action))
    this.updates.next(action)
  }

  [getSymbol('iterator')]() {
    return this._branch[getSymbol('iterator')]()
  }

  toJSON() {
    return {
      head: this.head ? this.head.id : null,
      root: this.root ? this.root.id : null,
      list: Array.from(this._branch),
      tree: this._tree.toJS(this.root),
      size: this.size
    }
  }
}

export default History
