import React from 'react'
import { Microcosm, Observable, Subject, patch } from 'microcosm'
import { Presenter, ActionButton, withSend } from 'microcosm-react'
import { mount } from 'enzyme'

let View = withSend(function({ send }) {
  return <button id="button" onClick={() => send('test', true)} />
})

let timer = time => new Promise(resolve => setTimeout(resolve, time))

class Repo extends Microcosm {
  setup() {
    this.addDomain('color', {
      getInitialState() {
        return 'yellow'
      }
    })
  }
}

describe('::getModel', function() {
  it('passes data to the view ', function() {
    class Hello extends Presenter {
      getModel(repo, { place }) {
        return {
          greeting: 'Hello, ' + place + '!'
        }
      }

      render() {
        return <p>{this.model.greeting}</p>
      }
    }

    let wrapper = mount(<Hello place="world" />)

    expect(wrapper.text()).toEqual('Hello, world!')
  })

  it('builds the view model into state', async function() {
    class MyPresenter extends Presenter {
      getModel(repo) {
        return {
          color: repo.watch('color')
        }
      }
      render() {
        return <div>{this.model.color}</div>
      }
    }

    let repo = new Repo()
    let presenter = mount(<MyPresenter repo={repo} />)

    await repo.push(patch, { color: 'red' })

    expect(presenter.text()).toEqual('red')
  })

  it('handles non-function view model bindings', function() {
    class MyPresenter extends Presenter {
      getModel(repo, { name }) {
        return {
          upper: name.toUpperCase()
        }
      }
      render() {
        return <p>{this.model.upper}</p>
      }
    }

    var presenter = mount(<MyPresenter name="phil" />)

    expect(presenter.text()).toEqual('PHIL')
  })

  it('does not update state if no key changes', function() {
    let spy = jest.fn(() => <p>Test</p>)

    class MyPresenter extends Presenter {
      getModel() {
        return { active: true }
      }

      render() {
        spy(this.model)
        return null
      }
    }

    let repo = new Repo()

    mount(<MyPresenter repo={repo} />)

    repo.push(patch, repo.state)
    repo.push(patch, { color: 'turqoise' })

    expect(spy).toHaveBeenCalledTimes(1)
  })

  describe('when first building a model', function() {
    it.skip('passes the repo as the second argument of model callbacks', function() {
      expect.assertions(1)

      let repo = new Repo()

      class TestCase extends Presenter {
        getModel() {
          return {
            name: this.process
          }
        }

        process(_state, fork) {
          expect(fork.parent).toBe(repo)
        }
      }

      mount(<TestCase repo={repo} />)
    })

    it.skip('invokes model callbacks in the scope of the presenter', function() {
      expect.assertions(1)

      class TestCase extends Presenter {
        getModel(props) {
          return {
            name: this.process
          }
        }

        process() {
          expect(this).toBeInstanceOf(TestCase)
        }
      }

      mount(<TestCase />)
    })
  })

  describe('when updating props', function() {
    it('recalculates the view model if the props are different', function() {
      let repo = new Microcosm()

      repo.addDomain('name', {
        getInitialState() {
          return 'Kurtz'
        }
      })

      class Namer extends Presenter {
        getModel(repo, { prefix }) {
          return {
            name: repo.watch('name', name => prefix + ' ' + name)
          }
        }
        render() {
          return <p>{this.model.name}</p>
        }
      }

      let wrapper = mount(<Namer prefix="Colonel" repo={repo} />)

      wrapper.setProps({ prefix: 'Captain' })

      expect(wrapper.text()).toEqual('Captain Kurtz')
    })

    it('does not recalculate the view model if the props are the same', function() {
      let repo = new Microcosm()
      let spy = jest.fn()

      class Namer extends Presenter {
        getModel = spy

        render() {
          return <span />
        }
      }

      let wrapper = mount(<Namer prefix="Colonel" repo={repo} />)

      wrapper.setProps({ prefix: 'Colonel' })

      expect(spy.mock.calls.length).toEqual(1)
    })
  })

  describe('when updating state', function() {
    class Namer extends Presenter {
      state = {
        greeting: 'Hello'
      }

      getModel(repo, props, state) {
        return {
          text: state.greeting + ', ' + props.name
        }
      }

      render() {
        let { text } = this.model

        return <p>{text}</p>
      }
    }

    it('calculates the model with state', function() {
      let wrapper = mount(<Namer name="Colonel" />)

      expect(wrapper.text()).toEqual('Hello, Colonel')
    })

    it('recalculates the model when state changes', function() {
      let wrapper = mount(<Namer name="Colonel" />)

      wrapper.setState({
        greeting: 'Salutations'
      })

      expect(wrapper.text()).toEqual('Salutations, Colonel')
    })

    it('does not recalculate the model when state is the same', function() {
      let spy = jest.fn(() => {
        return {}
      })

      class TrackedNamer extends Namer {
        getModel = spy
        render() {
          return <p>Test</p>
        }
      }

      let wrapper = mount(<TrackedNamer name="Colonel" />)

      wrapper.setState({
        greeting: 'Hello'
      })

      expect(spy).toHaveBeenCalledTimes(1)
    })
  })
})

describe('::setup', function() {
  it('the model is not available in setup', function() {
    expect.assertions(1)

    class MyPresenter extends Presenter {
      setup() {
        expect(this.model).toEqual(undefined)
      }
      getModel() {
        return { foo: 'bar' }
      }
    }

    mount(<MyPresenter />)
  })

  it('runs a setup function when created', function() {
    let test = jest.fn()

    class MyPresenter extends Presenter {
      get setup() {
        return test
      }
    }

    mount(<MyPresenter repo={new Microcosm()} />)

    expect(test).toHaveBeenCalled()
  })

  it('domains added in setup show up in the view model', function() {
    class MyPresenter extends Presenter {
      setup(repo) {
        repo.addDomain('prop', {
          getInitialState() {
            return 'test'
          }
        })
      }

      getModel(repo) {
        return {
          prop: repo.watch('prop')
        }
      }

      render() {
        return <p>{this.model.prop}</p>
      }
    }

    let prop = mount(<MyPresenter />).text()

    expect(prop).toEqual('test')
  })

  it('calling setState in setup does not raise a warning', function() {
    class MyPresenter extends Presenter {
      setup() {
        this.setState({ foo: 'bar' })
      }
    }

    mount(<MyPresenter repo={new Microcosm()} />)
  })
})

describe('::ready', function() {
  it('runs after setup setup', function() {
    expect.assertions(1)

    class MyPresenter extends Presenter {
      setup() {
        this.setupCalled = true
      }
      ready() {
        expect(this.setupCalled).toBe(true)
      }
    }

    mount(<MyPresenter />)
  })

  it('has the latest model', function() {
    expect.assertions(1)

    class MyPresenter extends Presenter {
      setup(repo) {
        repo.addDomain('test', {
          getInitialState: () => 'test'
        })
      }

      ready() {
        expect(this.model.test).toEqual('test')
      }

      getModel(repo) {
        return {
          test: repo.watch('test')
        }
      }
    }

    mount(<MyPresenter />)
  })
})

describe('::update', function() {
  it('runs an update function when it gets new props', function() {
    let test = jest.fn()

    class MyPresenter extends Presenter {
      update(repo, props) {
        test(props.test)
      }
    }

    let wrapper = mount(<MyPresenter test="foo" />)

    wrapper.setProps({ test: 'bar' })

    expect(test).toHaveBeenCalledTimes(1)
    expect(test).toHaveBeenCalledWith('bar')
  })

  it('does not run an update function when no props change', function() {
    let wrapper = mount(<Presenter test="foo" />)
    let spy = jest.spyOn(wrapper.instance(), 'update')

    wrapper.setProps({ test: 'foo' })

    expect(spy).not.toHaveBeenCalled()
  })

  it('it has access to the old props when update is called', function() {
    let callback = jest.fn()

    class Test extends Presenter {
      update(repo, { color }) {
        callback(this.props.color, color)
      }
    }

    mount(
      <Test color="red">
        <p>Hey</p>
      </Test>
    ).setProps({ color: 'blue' })

    expect(callback).toHaveBeenCalledWith('red', 'blue')
  })

  it('has the latest model when props change', function() {
    let test = jest.fn()

    class MyPresenter extends Presenter {
      getModel(repo, props) {
        return {
          next: props.test
        }
      }
      update(repo, props) {
        test(this.model.next)
      }
    }

    let wrapper = mount(<MyPresenter test="one" />)

    wrapper.setProps({ test: 'two' })

    expect(test).toHaveBeenCalledTimes(1)
    expect(test).toHaveBeenCalledWith('two')
  })
})

describe('::teardown', function() {
  it('teardown gets the last props', function() {
    let spy = jest.fn()

    class Test extends Presenter {
      get teardown() {
        return spy
      }
    }

    let wrapper = mount(<Test test="foo" />)

    wrapper.setProps({ test: 'bar' })

    wrapper.unmount()

    expect(spy.mock.calls[0][1].test).toEqual('bar')
  })

  it('eliminates the teardown subscription when overriding getRepo', function() {
    let spy = jest.fn()

    class Test extends Presenter {
      teardown = spy

      getRepo(repo) {
        return repo
      }
    }

    let repo = new Microcosm()
    let wrapper = mount(<Test repo={repo} />)

    wrapper.unmount()
    repo.shutdown()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('does not teardown a repo that is not a fork', function() {
    let spy = jest.fn()

    class Test extends Presenter {
      getRepo(repo) {
        return repo
      }
    }

    let repo = new Microcosm()

    repo.subscribe({ complete: spy })

    mount(<Test repo={repo} />).unmount()

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('unsubscribes from an unforked repo', function() {
    let spy = jest.fn()

    class Test extends Presenter {
      getModel() {
        return {
          test: repo.watch('test', spy)
        }
      }
      getRepo(repo) {
        return repo
      }
    }

    let repo = new Microcosm()

    mount(<Test repo={repo} />).unmount()

    repo.addDomain('test', {
      getInitialState: () => true
    })

    // Once: for the initial calculation
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('changes during teardown do not cause a recalculation', function() {
    let spy = jest.fn()

    class Test extends Presenter {
      getModel() {
        return { test: repo.watch('test', spy) }
      }
      teardown(repo) {
        repo.addDomain('test', {
          getInitialState: () => true
        })
      }
      getRepo(repo) {
        return repo
      }
    }

    let repo = new Microcosm()

    mount(<Test repo={repo} />).unmount()

    // Once: for the initial calculation
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe.skip('purity', function() {
  it('does not cause a re-render when shallowly equal', function() {
    let repo = new Microcosm()
    let renders = jest.fn(() => <p>Test</p>)

    repo.patch({ name: 'Kurtz' })

    class Namer extends Presenter {
      getModel() {
        return { name: state => state.name }
      }

      get view() {
        return renders
      }
    }

    mount(<Namer repo={repo} />)

    repo.patch({ name: 'Kurtz', unrelated: true })

    expect(renders.mock.calls.length).toEqual(1)
  })
})

describe.skip('unmounting', function() {
  it('ignores an repo when it unmounts', function() {
    let spy = jest.fn()

    class Test extends Presenter {
      setup(repo) {
        repo.teardown = spy
      }
    }

    mount(<Test />).unmount()

    expect(spy).toHaveBeenCalled()
  })

  it('does not update the view model when umounted', function() {
    let spy = jest.fn(n => {})

    class MyPresenter extends Presenter {
      // This should only run once
      get getModel() {
        return spy
      }
    }

    let repo = new Microcosm()
    let wrapper = mount(<MyPresenter repo={repo} />)

    wrapper.unmount()

    repo.patch({ foo: 'bar' })

    expect(spy.mock.calls.length).toEqual(1)
  })
})

describe.skip('Efficiency', function() {
  it('does not subscribe to a change if there is no model', function() {
    let repo = new Repo()

    jest.spyOn(repo, 'on')

    class Parent extends Presenter {}

    mount(<Parent repo={repo} />)

    expect(repo.on).not.toHaveBeenCalled()
  })

  it('does not subscribe to a change if there is no stateful model binding', function() {
    let repo = new Repo()

    jest.spyOn(repo, 'on')

    class Parent extends Presenter {
      getModel() {
        return {
          foo: 'bar'
        }
      }
    }

    mount(<Parent repo={repo} />)

    expect(repo.on).not.toHaveBeenCalled()
  })

  it('child view model is not recalculated when parent repos cause them to re-render', async function() {
    let repo = new Repo()

    let model = jest.fn(function() {
      return {
        color: state => state.color
      }
    })

    class Child extends Presenter {
      getModel = model

      render() {
        return <p>{this.model.color}</p>
      }
    }

    class Parent extends Presenter {
      view = Child
    }

    let wrapper = mount(<Parent repo={repo} />)

    repo.patch({ color: 'green' })

    await timer(100)

    expect(model).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toEqual('green')
  })

  it('should re-render when state changes', function() {
    let spy = jest.fn(() => null)

    class Test extends Presenter {
      view = spy
    }

    mount(<Test />).setState({ test: true })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('should re-render when a property is added', function() {
    let spy = jest.fn(() => null)

    class Test extends Presenter {
      view = spy
    }

    mount(<Test />).setProps({ another: true })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('should re-render when a property is removed', function() {
    let spy = jest.fn(() => null)

    class Test extends Presenter {
      view = spy
    }

    mount(<Test prop="true" />).setProps({ prop: null })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('cancels pending updates when unmounted', async function() {
    let spy = jest.fn(() => <p>Test</p>)

    class Test extends Presenter {
      getModel() {
        return {
          anything: state => Math.random()
        }
      }

      view = spy
    }

    let repo = new Repo()
    let wrapper = mount(<Test repo={repo} />)

    // Cause a change
    repo.patch({ color: 'teal' })

    // Wait for history to reconcile, this will trigger a change
    // that activates the model
    await repo.history

    // Unmounting should kill all outstanding update frames
    wrapper.unmount()

    // Wait for the animation frame to fire
    await timer(10)

    // The frame should have been cancelled, so render is called once
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('does not render again if forced to render in the meantime', async function() {
    let spy = jest.fn(() => <p>Test</p>)

    class Test extends Presenter {
      getModel() {
        return {
          anything: state => Math.random()
        }
      }

      view = spy
    }

    let repo = new Repo()
    let wrapper = mount(<Test repo={repo} />)

    // Cause a change
    repo.patch({ color: 'teal' })

    // Wait for history to reconcile, this will trigger a change
    // that activates the model
    await repo.history

    // Now send new properties in, which forces a render
    wrapper.setProps({ foo: 'bar' })

    // Wait for the animation frame to fire
    await timer(10)

    // The frame should have been cancelled, so render is called twice:
    // for the initial render, and new props
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('batches pending updates', async function() {
    let spy = jest.fn(() => <p>Test</p>)

    class Test extends Presenter {
      getModel() {
        return {
          anything: state => Math.random()
        }
      }

      view = spy
    }

    let repo = new Repo()
    let wrapper = mount(<Test repo={repo} />)

    // Cause a change
    repo.patch({ color: 'teal' })

    // Wait for history to reconcile, this will trigger a change
    // that activates the model
    await repo.history

    // Now send new properties in, which forces a render
    wrapper.setProps({ foo: 'bar' })
    wrapper.setProps({ foo: 'baz' })

    // Wait for the animation frame to fire
    await timer(100)

    // The frame should have been cancelled, so render is called three times:
    // for the initial render, and the two property injections
    expect(spy).toHaveBeenCalledTimes(3)
  })
})

describe.skip('::render', function() {
  it('the default render implementation passes children', function() {
    let wrapper = mount(
      <Presenter>
        <p>Test</p>
      </Presenter>
    )

    expect(wrapper.text()).toEqual('Test')
  })

  it('handles overridden an overriden render method', function() {
    class Test extends Presenter {
      render() {
        return <p>Test</p>
      }
    }

    expect(mount(<Test />).text()).toEqual('Test')
  })

  it('scope of render should be the presenter', function() {
    expect.assertions(1)

    class Test extends Presenter {
      render() {
        expect(this).toBeInstanceOf(Test)

        return <p>Test</p>
      }
    }

    mount(<Test />)
  })

  it('overridden render passes context', function() {
    expect.assertions(1)

    function Child(props, context) {
      expect(context.repo).toBeDefined()

      return <p>Test</p>
    }

    Child.contextTypes = {
      repo: () => {}
    }

    class Test extends Presenter {
      render() {
        return <Child />
      }
    }

    mount(<Test />)
  })
})

describe.skip('::getRepo', function() {
  it('can circumvent forking command', function() {
    class NoFork extends Presenter {
      getRepo(repo) {
        return repo
      }
    }

    let repo = new Microcosm()
    let wrapper = mount(<NoFork repo={repo} />)

    expect(wrapper.instance().repo).toEqual(repo)
  })
})

describe.skip('intercepting actions', function() {
  it('receives intent events', function() {
    let test = jest.fn()

    class MyPresenter extends Presenter {
      view = View

      intercept() {
        return { test }
      }
    }

    mount(<MyPresenter />)
      .find(View)
      .simulate('click')

    expect(test.mock.calls[0][1]).toEqual(true)
  })

  it('actions do not bubble to different repo types', function() {
    class Child extends Presenter {
      view = View
    }

    class Parent extends Presenter {
      render() {
        return <div>{this.props.children}</div>
      }
    }

    let top = new Microcosm({ maxHistory: Infinity })
    let bottom = new Microcosm({ maxHistory: Infinity })

    let wrapper = mount(
      <Parent repo={top}>
        <Child repo={bottom} />
      </Parent>
    )

    wrapper.find(View).simulate('click')

    expect(top.history.size).toBe(1)
    expect(bottom.history.size).toBe(2)
  })

  it('intents do not bubble to different repo types even if not forking', function() {
    class Child extends Presenter {
      view = View
    }

    class Parent extends Presenter {
      getRepo(repo) {
        return repo
      }
      render() {
        return <div>{this.props.children}</div>
      }
    }

    let top = new Microcosm({ maxHistory: Infinity })
    let bottom = new Microcosm({ maxHistory: Infinity })

    let wrapper = mount(
      <Parent repo={top}>
        <Child repo={bottom} />
      </Parent>
    )

    wrapper.find(View).simulate('click')

    expect(top.history.size).toBe(1)
    expect(bottom.history.size).toBe(2)
  })

  it('forwards intents to the repo as actions', function() {
    class MyPresenter extends Presenter {
      view() {
        return <View />
      }
    }

    let repo = new Microcosm({ maxHistory: 1 })

    mount(<MyPresenter repo={repo} />)
      .find(View)
      .simulate('click')

    expect(repo.history.head.command.toString()).toEqual('test')
  })

  it('send bubbles up to parent presenters', function() {
    let test = jest.fn()
    let intercepted = jest.fn()

    class Child extends Presenter {
      view() {
        return <View />
      }
    }

    class Parent extends Presenter {
      intercept() {
        return { test: (repo, props) => intercepted(props) }
      }
      view() {
        return <Child />
      }
    }

    mount(<Parent repo={new Microcosm()} />)
      .find(View)
      .simulate('click')

    expect(test).not.toHaveBeenCalled()
    expect(intercepted).toHaveBeenCalledWith(true)
  })

  it('send with an action bubbles up to parent presenters', function() {
    let test = jest.fn()
    let intercepted = jest.fn()

    let Child = withSend(function({ send }) {
      return <button id="button" onClick={() => send(test, true)} />
    })

    class Parent extends Presenter {
      intercept() {
        return {
          [test]: (repo, val) => intercepted(val)
        }
      }
      view() {
        return <Child />
      }
    }

    mount(<Parent repo={new Microcosm()} />)
      .find(Child)
      .simulate('click')

    expect(test).not.toHaveBeenCalled()
    expect(intercepted).toHaveBeenCalledWith(true)
  })

  it('actions are tagged', function() {
    let spy = jest.fn()

    let a = function a() {}
    let b = function a() {}

    class TestView extends React.Component {
      static contextTypes = {
        send: () => {}
      }
      render() {
        return <button id="button" onClick={() => this.context.send(b, true)} />
      }
    }

    class Test extends Presenter {
      intercept() {
        return { [a]: spy }
      }
      view() {
        return <TestView />
      }
    }

    mount(<Test />)
      .find(TestView)
      .simulate('click')

    expect(spy).not.toHaveBeenCalled()
  })

  it('send is available in setup', function() {
    let test = jest.fn()

    class Parent extends Presenter {
      setup() {
        this.send('test')
      }
      intercept() {
        return { test }
      }
    }

    mount(<Parent />)

    expect(test).toHaveBeenCalled()
  })

  it('send can be called directly from the Presenter', function() {
    let test = jest.fn()

    class Parent extends Presenter {
      intercept() {
        return { test }
      }
    }

    mount(<Parent />)
      .instance()
      .send('test', true)

    expect(test).toHaveBeenCalled()
  })

  it('shares context between setup() and intercept()', function() {
    class Parent extends Presenter {
      setup() {
        this.foo = 'bar'
      }

      intercept() {
        return {
          test: this.assertionFunction
        }
      }

      assertionFunction() {
        expect(this.foo).toEqual('bar')
      }
    }

    mount(<Parent />)
      .instance()
      .send('test')
  })

  it('context is the intercepting presenter', function() {
    expect.assertions(1)

    class Parent extends Presenter {
      intercept() {
        return {
          test: this.assertionFunction
        }
      }

      assertionFunction() {
        expect(this).toBeInstanceOf(Parent)
      }
    }

    class Child extends Presenter {
      render() {
        return <ActionButton action="test" />
      }
    }

    let wrapper = mount(
      <Parent>
        <Child />
      </Parent>
    )

    wrapper.find(ActionButton).simulate('click')
  })
})

describe.skip('forks', function() {
  it('nested presenters fork in the correct order', function() {
    class Top extends Presenter {
      setup(repo) {
        repo.name = 'top'
      }
    }

    class Middle extends Presenter {
      setup(repo) {
        repo.name = 'middle'
      }
    }

    class Bottom extends Presenter {
      setup(repo) {
        repo.name = 'bottom'
      }

      render() {
        let names = []
        let repo = this.repo

        while (repo) {
          names.push(repo.name)
          repo = repo.parent
        }

        return <p>{names.join(', ')}</p>
      }
    }

    let text = mount(
      <Top>
        <Middle>
          <Bottom />
        </Middle>
      </Top>
    ).text()

    expect(text).toEqual('bottom, middle, top')
  })
})

describe.skip('::send', function() {
  it('autobinds send', function() {
    expect.assertions(2)

    class Test extends Presenter {
      prop = true

      intercept() {
        return {
          test: () => {
            expect(this).toBeInstanceOf(Test)
            expect(this.prop).toBe(true)
          }
        }
      }

      view = function({ send }) {
        return <button onClick={() => send('test')}>Click me</button>
      }
    }

    mount(<Test />)
      .find('button')
      .simulate('click')
  })

  it('dispatches the action using the current repo if nothing else responds', function() {
    expect.assertions(1)

    class Parent extends Presenter {
      setup(repo) {
        repo.addDomain('parent', {
          getInitialState() {
            return true
          }
        })
      }
    }

    class Child extends Presenter {
      setup(repo) {
        repo.addDomain('child', {
          getInitialState() {
            return true
          }
        })
      }
    }

    let action = function() {
      return function(action, repo) {
        expect(repo.state.child).toBe(true)
      }
    }

    let wrapper = mount(
      <Parent>
        <Child>
          <ActionButton action={action} />
        </Child>
      </Parent>
    )

    wrapper.find(ActionButton).simulate('click')
  })
})

describe.skip('::children', function() {
  it('re-renders when it gets new children', function() {
    let wrapper = mount(
      <Presenter>
        <span>1</span>
      </Presenter>
    )

    wrapper.setProps({ children: <span>2</span> })

    expect(wrapper.text()).toEqual('2')
  })

  it('does not recalculate the model when receiving new children', function() {
    let spy = jest.fn()

    class Test extends Presenter {
      getModel = spy
    }

    let children = <span>1</span>
    let wrapper = mount(<Test children={children} />)

    wrapper.setProps({ children })

    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe.skip('::modelWillUpdate', function() {
  it('does not invoke on the first model calculation', () => {
    let spy = jest.fn()

    class Test extends Presenter {
      getModel(props) {
        return {
          id: props.id
        }
      }

      modelWillUpdate = spy
    }

    mount(<Test id="2" />)

    expect(spy).not.toHaveBeenCalled()
  })

  it('is invoked before the new model is assigned', () => {
    expect.assertions(2)

    class Test extends Presenter {
      getModel(props) {
        return {
          id: props.id
        }
      }

      modelWillUpdate(repo, model) {
        expect(this.model.id).toBe('2')
        expect(model.id).toBe('3')
      }
    }

    mount(<Test id="2" />).setProps({ id: '3' })
  })

  it('provides a patch of the difference', () => {
    expect.assertions(1)

    class Test extends Presenter {
      getModel(props) {
        return {
          static: true,
          dynamic: props.id
        }
      }

      modelWillUpdate(repo, model, patch) {
        expect(patch).toEqual({ dynamic: '3' })
      }
    }

    mount(<Test id="2" />).setProps({ id: '3' })
  })
})

describe.skip('::batching', function() {
  it('bundles together repo actions when in batch mode', done => {
    let repo = new Repo()

    class Test extends Presenter {
      getModel() {
        return {
          color: state => state.color
        }
      }

      modelWillUpdate(repo, state, change) {
        if (change.color === 'pink') {
          done()
        } else {
          done(new Error('Expected color to be pink'))
        }
      }

      render() {
        return <p>{this.model.color}</p>
      }
    }

    mount(<Test repo={repo} />)

    repo.patch({ color: 'red' })
    repo.patch({ color: 'blue' })
    repo.patch({ color: 'pink' })
  })

  it('bundles together model calls in batch mode', done => {
    let repo = new Repo()

    class Test extends Presenter {
      getModel() {
        return {
          color: new Observable(observer => {
            observer.next('red')

            setTimeout(function() {
              observer.next('blue')
              observer.next('pink')
            })
          })
        }
      }

      modelWillUpdate(repo, state, { color }) {
        if (color === 'pink') {
          done()
        } else {
          done(new Error('Expected color to be pink instead of ' + color))
        }
      }

      render() {
        return <p>{this.model.color}</p>
      }
    }

    let text = mount(<Test repo={repo} />).text()

    if (text !== 'red') {
      throw new Error('Expected initial text to be red instead of ' + text)
    }
  })
})
