import type { ProjectId } from './useProjectDrawer.ts'

export type PortfolioNavDestination =
  | { kind: 'section'; sectionId: string }
  | { kind: 'project'; projectId: ProjectId }

export type PortfolioNavItem = {
  id: string
  label: string
  destination: PortfolioNavDestination
}

export const portfolioNavItems = [
  {
    id: 'about',
    label: 'About Me',
    destination: { kind: 'section', sectionId: 'about' },
  },
  {
    id: 'designer-os',
    label: 'Designer OS',
    destination: { kind: 'project', projectId: 'case-study-1' },
  },
  {
    id: 'gen-z-learning',
    label: 'Gen-Z Learning Platform',
    destination: { kind: 'project', projectId: 'case-study-2' },
  },
  {
    id: 'enterprise-qa',
    label: 'Enterprise QA Platform',
    destination: { kind: 'project', projectId: 'case-study-3' },
  },
] as const satisfies readonly PortfolioNavItem[]
