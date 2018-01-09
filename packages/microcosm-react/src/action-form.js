import { createElement, PureComponent } from 'react'
import serialize from 'form-serialize'
import { Observable, Subject, merge } from 'microcosm'
import { identity, noop } from './utilities'

export class ActionForm extends PureComponent {
  constructor() {
    super(...arguments)

    this.queue = new Subject('action-form')
    this.submit = this.submit.bind(this)
  }

  get send() {
    return this.props.send || this.context.send
  }

  componentWillUnmount() {
    this.queue.unsubscribe()
  }

  render() {
    let props = merge(this.props, {
      onSubmit: this.submit,
      ref: el => (this.form = el)
    })

    delete props.tag
    delete props.action
    delete props.prepare
    delete props.serializer
    delete props.onStart
    delete props.onNext
    delete props.onComplete
    delete props.onNext
    delete props.onUnsubscribe
    delete props.onError
    delete props.send

    return createElement(this.props.tag, props)
  }

  onChange(status, result) {
    switch (status) {
      case 'start':
        this.props.onStart(result.payload, result.meta)
        break
      case 'next':
        this.props.onNext(result.payload, result.meta)
        break
      case 'complete':
        this.props.onComplete(result.payload, result.meta)
        break
      case 'error':
        this.props.onError(result.payload, result.meta)
        break
      case 'unsubscribe':
        this.props.onUnsubscribe(result.payload, result.meta)
        break
      default:
    }
  }

  submit(event) {
    const { onSubmit, prepare, serializer, action } = this.props

    console.assert(
      this.form,
      'ActionForm has no form reference and can not submit. This can happen',
      'if submit() is called after the parent component has unmounted.'
    )

    let params = prepare(serializer(this.form))
    let result = this.send(action, params)

    if (Observable.isObservable(result)) {
      let subscriber = result.subscribe({
        start: this.onChange.bind(this, 'start', result),
        error: this.onChange.bind(this, 'error', result),
        next: this.onChange.bind(this, 'next', result),
        complete: this.onChange.bind(this, 'complete', result),
        unsubscribe: this.onChange.bind(this, 'unsubscribe', result)
      })

      this.queue.subscribe(result)
    }

    if (event) {
      onSubmit(event, result)
    }

    return result
  }
}

ActionForm.contextTypes = {
  send: noop
}

ActionForm.defaultProps = {
  action: null,
  onSubmit: identity,
  onStart: identity,
  onNext: identity,
  onComplete: identity,
  onError: identity,
  onUnsubscribe: identity,
  onNext: identity,
  prepare: identity,
  send: null,
  tag: 'form',
  serializer: form => serialize(form, { hash: true, empty: true })
}
