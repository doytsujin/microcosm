/**
 * @flow
 */

import { set } from 'microcosm'
import Observable from 'zen-observable'

export function matches(item, matchers) {
  for (var key in matchers) {
    if (item.hasOwnProperty(key) === false || item[key] !== matchers[key]) {
      return false
    }
  }

  return true
}

export function filter(list, matchers) {
  return list.filter(item => matches(item, matchers))
}

export function reject(list, matchers) {
  return list.filter(item => !matches(item, matchers))
}

export function find(list, matchers) {
  for (var i = 0, len = list.length; i < len; i++) {
    let item = list[i]

    if (matches(item, matchers) === true) {
      return item
    }
  }

  return null
}

export function getName(item) {
  return item.alias ? item.alias.value : item.name.value
}

type NameReducer = (arg: Argument, name: string, variables: object) => *
export function reduceName(list: Arguments[], callback: NameReducer, extra: *) {
  let answer = {}

  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i]
    let name = getName(item)

    answer[name] = callback(item, name, extra)
  }

  return answer
}

export function observerHash(obj) {
  return new Observable(observer => {
    let keys = Object.keys(obj)
    let answer = Array.isArray(obj) ? [] : {}

    if (keys.length <= 0) {
      observer.next(answer)
    }

    Observable.of(...keys)
      .flatMap(key => obj[key].map(value => ({ key, value })))
      .map(next => {
        answer = set(answer, next.key, next.value)
        return answer
      })
      .subscribe(observer)
  })
}
