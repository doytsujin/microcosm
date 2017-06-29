import ReactDOM from 'react-dom'

export default function send(caller, action: *, ...payload: *) {
  let element = ReactDOM.findDOMNode(caller)
  let ev = new CustomEvent('event-send', {
    bubbles: true,
    detail: { action, payload }
  })

  element.dispatchEvent(ev)
}
