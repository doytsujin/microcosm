import { Microcosm } from 'microcosm'

it('fetches records by ID', async () => {
  let repo = new Microcosm()

  class Planets {
    all(repo) {
      return [{ id: 'mercury' }, { id: 'venus' }, { id: 'earth' }]
    }

    name(repo, planet) {
      return planet.name
    }

    star(repo, planet) {
      return repo.fetch('stars.find', { star: planet.star })
    }
  }

  repo.addDomain('planets', Planets)

  await repo.fetch('planets.all')

  expect(repo.state.planets).toHaveProperty('mercury')
  expect(repo.state.planets).toHaveProperty('venus')
  expect(repo.state.planets).toHaveProperty('earth')
})
