import Subject from './subject'

class Action extends Subject {
  open(payload) {
    this.next({ status: 'start', payload })
  }

  update(payload) {
    this.next({ status: 'next', payload })
  }

  resolve(payload) {
    this.next({ status: 'complete', payload })
    this.complete(payload)
  }

  reject(payload) {
    this.next({ status: 'error', payload })
    this.error(payload)
  }

  get payload() {
    return this.valueOf().payload
  }

  get status() {
    return this.valueOf().status
  }
}

export default Action
