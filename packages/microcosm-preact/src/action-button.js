import { h, Component } from 'preact'
import { Subject, merge } from 'microcosm'
import { identity } from './utilities'

export class ActionButton extends Component {
  constructor() {
    super(...arguments)

    this.queue = new Subject('action-button')
    this.click = this.click.bind(this)
  }

  get send() {
    return this.props.send || this.context.send
  }

  componentWillUnmount() {
    this.queue.unsubscribe()
  }

  render() {
    let props = merge(this.props, { onClick: this.click })

    delete props.tag
    delete props.action
    delete props.value
    delete props.onStart
    delete props.onNext
    delete props.onComplete
    delete props.onError
    delete props.onUnsubscribe
    delete props.send
    delete props.prepare

    if (this.props.tag === 'button' && props.type == null) {
      props.type = 'button'
    }

    return h(this.props.tag, props)
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

  click(event) {
    let { action, onClick, prepare, value } = this.props

    let params = prepare(value)
    let result = this.send(action, params)

    if (result && 'subscribe' in result) {
      result.subscribe({
        start: this.onChange.bind(this, 'start', result),
        error: this.onChange.bind(this, 'error', result),
        next: this.onChange.bind(this, 'next', result),
        complete: this.onChange.bind(this, 'complete', result),
        unsubscribe: this.onChange.bind(this, 'unsubscribe', result)
      })

      this.queue.subscribe(result)
    }

    if (event) {
      onClick(event, result)
    }

    return result
  }
}

ActionButton.defaultProps = {
  action: 'no-action',
  onClick: identity,
  onStart: identity,
  onNext: identity,
  onComplete: identity,
  onError: identity,
  onUnsubscribe: identity,
  prepare: identity,
  send: null,
  tag: 'button',
  value: null
}
