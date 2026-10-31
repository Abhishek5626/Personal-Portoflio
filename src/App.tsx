import { Footer } from './components/Footer.tsx'
import { Header } from './components/Header.tsx'
import { Section } from './components/Section.tsx'

// Replace these placeholders with your own words. Do not leave example.com in place.
const siteName = 'Your Name'

const navLinks = [
  { href: '#intro', label: 'Introduction' },
  { href: '#work', label: 'Work' },
  { href: '#contact', label: 'Contact' },
]

const projects = [
  {
    id: 'project-1',
    title: 'Project title',
    description: 'Add a short description of this project.',
  },
]

const contactLink = {
  href: 'https://example.com',
  label: 'Your contact link',
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header name={siteName} links={navLinks} />
      <main id="main" className="content">
        <Section id="intro" heading="Introduction">
          <p>Add a short introduction about yourself.</p>
        </Section>
        <Section id="work" heading="Work">
          <p>Add your projects here.</p>
          <ul className="project-list">
            {projects.map((project) => (
              <li key={project.id}>
                <article className="project">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </article>
              </li>
            ))}
          </ul>
        </Section>
        <Section id="contact" heading="Contact">
          <p>Replace the link below with your email or profile.</p>
          <p>
            <a href={contactLink.href}>{contactLink.label}</a>
          </p>
        </Section>
      </main>
      <Footer name={siteName} />
    </>
  )
}
