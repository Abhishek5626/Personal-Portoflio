import { Navigation } from './Navigation.tsx'
import type { NavLink } from './Navigation.tsx'

type HeaderProps = {
  name: string
  links: NavLink[]
}

export function Header({ name, links }: HeaderProps) {
  return (
    <header className="site-header" id="top">
      <div className="content header-inner">
        <h1 className="site-title">{name}</h1>
        <Navigation links={links} />
      </div>
    </header>
  )
}
