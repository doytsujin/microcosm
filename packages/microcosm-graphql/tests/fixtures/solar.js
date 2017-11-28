import gql from 'graphql-tag'
import Repo from '../../src/repo'
import { find, filter } from '../../src/utilities'

export const SOLAR_SCHEMA = gql`
  type Star {
    id: ID
    name: String
    planets: [Planet]
  }

  type Planet {
    id: ID
    name: String
    weight: Int
    star: Star
  }

  type Query {
    planet(id: ID, name: String): Planet
    planets(name: String, weight: Int): [Planet]
    star(id: ID, name: String): Star
    stars(name: String): [Star]
    paginatedPlanets(limit: Int, offset: Int): [Planet]
  }
`

export const SOLAR_DATA = {
  Planet: [
    { id: '0', name: 'Mercury', weight: 100, star: '0' },
    { id: '1', name: 'Venus', weight: 200, star: '0' },
    { id: '2', name: 'Earth', weight: 300, star: '0' }
  ],
  Star: [{ id: '0', name: 'Sol' }, { id: '1', name: 'Alpha Centari' }]
}

export class SolarSystem extends Repo {
  static defaults = {
    schema: SOLAR_SCHEMA
  }

  setup() {
    this.addDomain('Planet', {
      all({ limit = Infinity, offset = 0 } = {}) {
        return Promise.resolve(SOLAR_DATA.Planet.slice(offset, offset + limit))
      }
    })

    this.addDomain('Star', {
      all() {
        return Promise.resolve(SOLAR_DATA.Star)
      }
    })

    this.addQuery('Query', {
      planet: {
        resolver: jest.fn(async (_root, args, repo) => {
          let records = await repo.fetch('Planet.all', args)

          return find(records, args)
        })
      },
      planets: {
        resolver: jest.fn(async (_root, args, repo) => {
          let records = await repo.fetch('Planet.all', args)

          return filter(records, args)
        })
      },
      paginatedPlanets: {
        resolver: (_root, args, repo) => {
          return repo.fetch('Planet.all', args)
        }
      },
      star: {
        resolver: jest.fn(async (_root, args, repo) => {
          let records = await repo.fetch('Star.all', args)

          return find(records, args)
        })
      },
      stars: {
        resolver: jest.fn(async (_root, args, repo) => {
          let records = await repo.fetch('Star.all', args)

          return find(records, args)
        })
      }
    })

    this.addQuery('Planet', {
      star: {
        resolver: jest.fn(async (planet, args, repo) => {
          let records = await repo.fetch('Star.all')

          return find(records, { id: planet.star })
        })
      }
    })

    this.addQuery('Star', {
      planets: {
        resolver: jest.fn(async (star, args, repo) => {
          let records = await repo.fetch('Planet.all')

          return find(records, { star: star.id })
        })
      }
    })
  }
}
