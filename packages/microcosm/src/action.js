/**
 * @fileoverview Actions encapsulate the process of resolving an
 * action creator. Create an action using `Microcosm::push`:
 * @flow
 */

import $observable from 'symbol-observable'
import Observable from 'zen-observable'
import coroutine from './coroutine'
import tag from './tag'
import { uid } from './utils'

type ActionUpdater = (payload?: mixed) => *

const ResolutionMap = {
  inactive: false,
  open: false,
  update: false,
  loading: false,
  done: true,
  resolve: true,
  error: true,
  reject: true,
  cancel: true,
  cancelled: true
}

Observable.prototype.then = function(pass, fail) {
  return new Promise((resolve, reject) => {
    let last = null

    this.subscribe({
      next(value) {
        last = value
      },
      complete() {
        resolve(last)
      },
      error: reject
    })
  }).then(pass, fail)
}

class Action {
  id: string
  command: Function
  status: Status
  payload: any
  disabled: boolean
  parent: ?Action
  timestamp: number
  children: Action[]
  origin: Microcosm

  constructor(
    command: string | Command,
    params: *[],
    status: ?Status,
    origin: Microcosm
  ) {
    this.id = uid('action')
    this.command = tag(command)
    this.status = 'inactive'
    this.payload = undefined
    this.disabled = false
    this.parentAction = null
    this.nextAction = null
    this.timestamp = Date.now()
    this.children = []
    this.origin = origin

    this.observable = new Observable(observer => {
      this.observer = observer

      if (status) {
        this._setState(status)
      }

      coroutine(this, params, origin)
    })
  }

  get type(): string {
    return this.command[this.status] || ''
  }

  get open(): ActionUpdater {
    return this._setState.bind(this, 'open')
  }

  get update(): ActionUpdater {
    return this._setState.bind(this, 'update')
  }

  get resolve(): ActionUpdater {
    return this._setState.bind(this, 'resolve')
  }

  get reject(): ActionUpdater {
    return this._setState.bind(this, 'reject')
  }

  get cancel(): ActionUpdater {
    return this._setState.bind(this, 'cancel')
  }

  then(pass, fail): Promise<*> {
    return new Promise((resolve, reject) => {
      this.observable.subscribe({
        complete: () => {
          resolve(this.payload)
        },
        error: reject
      })
    }).then(pass, fail)
  }

  subscribe() {
    return this.observable.subscribe(...arguments)
  }

  is(type: Status): boolean {
    return this.command[this.status] === this.command[type]
  }

  /**
   * Set up an action such that it depends on the result of another
   * series of actions.
   */
  link(actions: Action[]): this {
    let outstanding = actions.length

    const onResolve = () => {
      if (outstanding <= 1) {
        this.resolve()
      } else {
        outstanding -= 1
      }
    }

    actions.forEach(action => {
      action.subscribe({
        complete: onResolve,
        error: this.reject
      })
    })

    onResolve()

    return this
  }

  isDisconnected(): boolean {
    return !this.parentAction
  }

  /**
   * Remove the grandparent of this action, cutting off history.
   */
  prune() {
    if (this.parentAction) {
      this.parentAction.parentAction = null
    } else {
      console.assert(
        false,
        'Unable to prune action. It is already disconnected.'
      )
    }
  }

  /**
   * Set the next action after this one in the historical tree of
   * actions.
   */
  lead(child: ?Action) {
    this.nextAction = child

    if (child) {
      this.adopt(child)
    }
  }

  /**
   * Add action to the list of children
   */
  adopt(child: Action) {
    let index = this.children.indexOf(child)

    if (index < 0) {
      this.children.push(child)
    }

    child.parentAction = this
  }

  /**
   * Connect the parent node to the next node. Removing this action
   * from history.
   */
  remove() {
    if (this.parentAction) {
      this.parentAction.abandon(this)
    } else {
      console.assert(false, 'Action has already been removed.')
    }

    this.removeAllListeners()
  }

  /**
   * Remove a child action
   */
  abandon(child: Action) {
    let index = this.children.indexOf(child)

    if (index >= 0) {
      this.children.splice(index, 1)
      child.parentAction = null
    }

    // If the action is the oldest child of a parent, pass
    // on the lead role to the next child.
    if (this.nextAction === child) {
      this.lead(child.nextAction)
    }
  }

  _setState(status: Status, payload: mixed) {
    this.status = status

    // Check arguments, we want to allow payloads that are undefined
    if (arguments.length > 1) {
      this.payload = payload
    }

    let revision = {
      status: this.status,
      payload: this.payload,
      timestamp: Date.now()
    }

    this.observer.next(revision)

    if (ResolutionMap[status]) {
      this.observer.complete(revision)
    }

    return this
  }

  toString() {
    return this.command.toString()
  }

  toJSON() {
    return {
      id: this.id,
      status: this.status,
      type: this.type,
      payload: this.payload,
      disabled: this.disabled,
      children: this.children,
      next: this.nextAction && this.nextAction.id
    }
  }

  [$observable]() {
    return this.observable
  }

  map() {
    return this.observable.map(...arguments)
  }

  reduce() {
    return this.observable.reduce(...arguments)
  }
}

export default Action
