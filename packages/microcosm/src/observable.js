/**
 * Taken from zen-observable, with specific implimentation notes for Microcosm
 */

import { getSymbol } from './symbols'
import { Subject } from './subject'
import { set } from './data'
import { noop } from './empty'

function getObservable(obj) {
  return obj && obj[getSymbol('observable')]
}

class Subscription {
  constructor(observer, subscriber, origin) {
    this._cleanup = undefined
    this._observer = observer
    this._origin = origin

    observer.start.call(observer, this)

    if (this._observer === undefined) {
      return
    }

    observer = subscriptionObserver(this)

    try {
      // Call the subscriber function
      let cleanup = subscriber.call(undefined, observer)

      // The return value must be undefined, null, a subscription object, or a function
      if (cleanup != null) {
        if (typeof cleanup.unsubscribe === 'function') {
          cleanup = cleanup.unsubscribe()
        } else if (typeof cleanup !== 'function') {
          throw new TypeError(cleanup + ' is not a function')
        }

        this._cleanup = cleanup
      }
    } catch (error) {
      // If an error occurs during startup, then attempt to send the error
      // to the observer
      observer.error(error)
      return
    }

    // If the stream is already finished, then perform cleanup
    if (this._observer === undefined) {
      cleanupSubscription(this)
    }
  }

  get unsubscribe() {
    return handleUnsubscribe.bind(null, this)
  }
}

function subscriptionObserver(subscription) {
  return {
    next: handleNext.bind(null, subscription),
    complete: handleComplete.bind(null, subscription),
    error: handleError.bind(null, subscription),
    unsubscribe: subscription.unsubscribe.bind(subscription)
  }
}

function observer(config) {
  if (config == null) {
    throw new TypeError('Unable to subscribe via ' + config)
  }

  let observer = {
    start: noop,
    next: noop,
    error: noop,
    complete: noop,
    unsubscribe: noop
  }

  if (typeof config === 'function') {
    observer.next = arguments[0]

    if (arguments.length > 1) {
      observer.error = arguments[1]
    }

    if (arguments.length > 2) {
      observer.complete = arguments[2]
    }
  } else {
    for (var key in observer) {
      if (config[key]) {
        observer[key] = config[key]
      }
    }
  }

  return observer
}

function purge(subscriptions) {
  subscriptions.forEach(s => s.unsubscribe())
}

export class Observable {
  constructor(subscriber) {
    this._subscriber = subscriber
    this._subscriptions = new Set()
  }

  subscribe(config) {
    let subscription = new Subscription(
      observer(config),
      this._subscriber,
      this
    )

    this._subscriptions.add(subscription)

    return subscription
  }

  get unsubscribe() {
    return purge.bind(null, this._subscriptions)
  }

  [getSymbol('observable')]() {
    return this
  }

  map(fn) {
    return new Observable(observer => {
      this.subscribe({
        error: observer.error,
        unsubscribe: observer.unsubscribe,
        next: value => observer.next(fn(value)),
        complete: observer.complete
      })
    })
  }

  flatMap(fn) {
    return new Observable(observer => {
      let completed = false
      let subscriptions = []

      // Subscribe to the outer Observable
      let outer = this.subscribe({
        next(value) {
          if (fn) {
            try {
              value = fn(value)
            } catch (x) {
              observer.error(x)
              return
            }
          }

          // Subscribe to the inner Observable
          Observable.wrap(value).subscribe({
            _subscription: null,
            next: observer.next,
            error: observer.error,
            start(s) {
              subscriptions.push((this._subscription = s))
            },
            complete() {
              let i = subscriptions.indexOf(this._subscription)

              if (i >= 0) {
                subscriptions.splice(i, 1)
              }

              closeIfDone()
            }
          })
        },
        error: observer.error,
        complete() {
          completed = true
          closeIfDone()
        }
      })

      function closeIfDone() {
        if (completed && subscriptions.length === 0) {
          observer.complete()
        }
      }
    })
  }

  static of() {
    return new Observable(observer => {
      let last = undefined

      for (var i = 0; i < arguments.length; ++i) {
        last = arguments[i]
        observer.next(last)
      }

      observer.complete()
    })
  }

  static wrap(source) {
    if (source && typeof source === 'object') {
      if (getObservable(source)) {
        return source
      }

      if (typeof source.then === 'function') {
        return fromPromise(source)
      }
    }

    return new Observable(observer => {
      observer.next(source)
      observer.complete()
    })
  }
}

function cleanupSubscription(subscription) {
  let cleanup = subscription._cleanup

  subscription._origin._subscriptions.delete(subscription)

  if (cleanup) {
    // Drop the reference to the cleanup function so that we won't call it
    // more than once
    subscription._cleanup = undefined

    // Call the cleanup function
    cleanup()
  }
}

function handleNext(subscription, value) {
  if (subscription._observer) {
    return subscription._observer.next(value)
  }
}

function handleError(subscription, value) {
  let observer = subscription._observer

  if (observer === undefined) {
    throw value
  }

  subscription._observer = undefined

  observer.error(value)

  cleanupSubscription(subscription)
}

function handleComplete(subscription) {
  let observer = subscription._observer

  // If the stream is closed, then return undefined
  if (observer === undefined) {
    return undefined
  }

  subscription._observer = undefined

  observer.complete()

  cleanupSubscription(subscription)
}

function handleUnsubscribe(subscription) {
  let observer = subscription._observer

  if (observer === undefined) {
    return
  }

  subscription._observer = undefined

  observer.unsubscribe()

  cleanupSubscription(subscription)
}

export function fromPromise(promise) {
  return new Observable(observer => {
    promise
      .then(observer.next)
      .then(observer.complete)
      .catch(observer.error)
  })
}

export function observerHash(obj) {
  let subject = new Subject()

  // TODO: This should trigger on numbers, booleans, strings,
  // dates, etc... Everything that isn't an array or POJO
  if (obj == null || typeof obj !== 'object') {
    return Observable.of(obj)
  }

  if (getObservable(obj)) {
    return obj
  }

  let keys = Object.keys(obj)
  let payload = Array.isArray(obj) ? [] : {}
  let jobs = keys.length

  function complete() {
    if (--jobs <= 0) {
      subject.complete()
    }
  }

  function assign(key, value) {
    let payload = set(payload, key, value)

    // TODO: What if this was a filter?
    if (payload !== subject.payload) {
      subject.next(payload)
    }
  }

  keys.forEach(key => {
    let subscription = Observable.wrap(obj[key]).subscribe({
      next: assign.bind(null, key),
      complete: complete,
      error: subject.error
    })

    subject.subscribe(subscription)
  })

  return subject
}

Observable.hash = observerHash
