import React from 'react'
import Presenter from '../../src/addons/presenter'
import send from '../../src/event-send'
import { mount } from 'enzyme'

const action = () => {}

describe('send', function() {
  it('pushes an action to the nearest microcosm in the DOM tree', function() {
    let spy = jest.fn()

    let Child = () => (
      <button
        onClick={e => {
          send(e.target, action)
        }}
      >
        Hello
      </button>
    )

    class Parent extends Presenter {
      intercept() {
        return {
          [action]: spy
        }
      }

      render() {
        return <Child />
      }
    }

    mount(<Parent />).simulate('click')

    expect(spy).toHaveBeenCalled()
  })

  it('accepts a react component as the first argument', function() {
    let spy = jest.fn()

    class Child extends React.Component {
      render() {
        return (
          <button onClick={() => send(this, action)}>
            Hello
          </button>
        )
      }
    }

    class Parent extends Presenter {
      intercept() {
        return {
          [action]: spy
        }
      }

      render() {
        return <Child />
      }
    }

    mount(<Parent />).simulate('click')

    expect(spy).toHaveBeenCalled()
  })
})
