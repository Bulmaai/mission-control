import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EscalationAlert } from '@/components/escalation/EscalationPanel'

describe('EscalationAlert', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render(
      <EscalationAlert count={0} onClick={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders alert when there are escalations', () => {
    render(<EscalationAlert count={3} onClick={() => {}} />)
    expect(screen.getByText('3 escalations pending')).toBeInTheDocument()
    expect(screen.getByText('Agents need system help')).toBeInTheDocument()
  })

  it('renders singular form for 1 escalation', () => {
    render(<EscalationAlert count={1} onClick={() => {}} />)
    expect(screen.getByText('1 escalation pending')).toBeInTheDocument()
  })
})
