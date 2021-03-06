import React from 'react'
import data from '../data/index.json'

const SideNav = ({ graphics, currentSection }) => {
  const scrollToElement = (e, elem) => {
    e.preventDefault()

    window.scroll({
      top: elem.offsetTop - 400,
      left: 0,
      behavior: 'smooth'
    })
  }

  return (
    <aside className="side-nav">
      <nav>
        <ol className="side-nav__list">
          {graphics.map(({ num, elem }) => (
            <li
              key={num}
              className={
                'side-nav__list__link' +
                (num === currentSection ? ' -active' : '')
              }
            >
              <a
                href={'#graphic-' + num}
                onClick={e => {
                  scrollToElement(e, elem)
                }}
              >
                {data[num].heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  )
}

export default SideNav
