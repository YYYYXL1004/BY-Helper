import React from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import AdvisorOverview from './AdvisorOverview'
import { useStore, type Institution } from '../../stores/appStore'

vi.mock('./AiOutreachAssistant', () => ({
  default: () => <div data-testid="ai-outreach-assistant" />
}))

const advisorBase = {
  title: '教授',
  researchArea: '人工智能',
  homepage: null,
  lastContactDate: null,
  reputationScore: null,
  notes: null,
  assets: [],
  interviews: [],
  contactRecords: [],
}

const institutionsFixture: Institution[] = [
  {
    id: 'inst-1',
    name: '测试大学',
    department: '计算机学院',
    tier: 'REACH',
    degreeType: 'MASTER',
    applicationStatus: 'WATCHING',
    campDeadline: null,
    pushDeadline: null,
    expectedQuota: null,
    policyTags: '[]',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    tasks: [],
    advisors: [
      {
        id: 'advisor-1',
        institutionId: 'inst-1',
        email: 'zhang@example.com',
        name: '张教授',
        contactStatus: 'PENDING',
        ...advisorBase,
      },
      {
        id: 'advisor-2',
        institutionId: 'inst-1',
        email: 'li@example.com',
        name: '李教授',
        contactStatus: 'REPLIED',
        ...advisorBase,
      },
    ],
  },
]

describe('AdvisorOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useStore.setState({
      currentView: 'advisors',
      selectedInstitutionId: null,
      institutions: institutionsFixture,
      orphanTasks: [],
      isLoading: false,
      error: null,
      conflictWarnings: [],
      emailTemplates: [],
    })
  })

  it('shows Chinese status labels and opens the institution advisor detail from advisor name', () => {
    const onSelectAdvisor = vi.fn()

    render(<AdvisorOverview institutions={institutionsFixture} onSelectInstitution={vi.fn()} onSelectAdvisor={onSelectAdvisor} />)

    expect(screen.getByText('待联系')).toBeInTheDocument()
    expect(screen.getByText('已回复')).toBeInTheDocument()
    expect(screen.queryByText('PENDING')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '张教授' }))

    expect(onSelectAdvisor).toHaveBeenCalledWith('inst-1', 'advisor-1')
  })

  it('enables reorder handles per institution group only in reorder mode', () => {
    render(<AdvisorOverview institutions={institutionsFixture} onSelectInstitution={vi.fn()} onSelectAdvisor={vi.fn()} />)

    expect(screen.getByRole('button', { name: '调整顺序' })).toBeInTheDocument()
    expect(screen.queryByLabelText('拖动排序')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '调整顺序' }))

    expect(screen.getByRole('button', { name: '完成排序' })).toBeInTheDocument()
    expect(screen.getAllByLabelText('拖动排序')).toHaveLength(2)
  })
})
