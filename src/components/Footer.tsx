type FooterProps = {
  name: string
}

export function Footer({ name }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="content">
        <p>{name}</p>
      </div>
    </footer>
  )
}
