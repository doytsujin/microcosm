import Microcosm from 'microcosm'

describe.skip('History node children', function() {
  const action = n => n

  it('can determine children', function() {
    const repo = new Microcosm()

    const a = repo.append(action)
    const b = repo.append(action)

    repo.checkout(a)

    const c = repo.append(action)

    expect(a.children.map(n => n.id)).toEqual([b.id, c.id])
  })

  it('does not lose children when checking out nodes on the left', function() {
    const repo = new Microcosm()

    repo.append(action)

    const b = repo.append(action)
    const c = repo.append(action)

    repo.checkout(b)

    const d = repo.append(action)

    expect(b.children).toEqual([c, d])
  })

  it('does not lose children when checking out nodes on the right', function() {
    const repo = new Microcosm()

    repo.append(action)

    const b = repo.append(action)
    const c = repo.append(action)

    repo.checkout(b)

    const d = repo.append(action)

    repo.checkout(c)

    expect(b.children).toEqual([c, d])
  })

  it('will not remove a child it does not own', function() {
    const repo = new Microcosm()

    const a = repo.append(action)
    const b = repo.append(action)

    repo.checkout(a)

    const c = repo.append(action)

    // Note: This does not work
    b.abandon(c)

    expect(c.parent).toBe(a)
  })
})
