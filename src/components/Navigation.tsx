export type NavLink = {
  href: string
  label: string
}

type NavigationProps = {
  links: NavLink[]
}

export function Navigation({ links }: NavigationProps) {
  return (
    <nav className="site-nav" aria-label="Primary">
      <ul className="nav-list">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
