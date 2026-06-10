import React from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import KanbanBoard from './KanbanBoard'
import { useStore, type Institution } from '../../stores/appStore'

const institutionBase = {
  department: '计算机学院',
  degreeType: 'MASTER' as const,
  applicationStatus: 'WATCHING' as const,
  campDeadline: null,
  pushDeadline: null,
  expectedQuota: null,
  policyTags: '[]',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  tasks: [],
  advisors: [],
}

const institutionsFixture: Institution[] = [
  {
    id: 'inst-1',
    name: '测试大学A',
    tier: 'REACH',
    ...institutionBase,
  },
  {
    id: 'inst-2',
    name: '测试大学B',
    tier: 'REACH',
    ...institutionBase,
  },
  {
    id: 'inst-3',
    name: '测试大学C',
    tier: 'MATCH',
    ...institutionBase,
  },
]

describe('KanbanBoard institution ordering mode', () => {
  beforeEach(() => {
    useStore.setState({
      currentView: 'kanban',
      selectedInstitutionId: null,
      institutions: institutionsFixture,
      orphanTasks: [],
      isLoading: false,
      error: null,
      conflictWarnings: [],
      emailTemplates: [],
    })
  })

  it('separates daily viewing from reorder mode', () => {
    render(<KanbanBoard onSelectInstitution={vi.fn()} />)

    expect(screen.getByRole('button', { name: '调整顺序' })).toBeInTheDocument()
    expect(screen.queryByLabelText('拖动排序')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '调整顺序' }))

    expect(screen.getByRole('button', { name: '完成排序' })).toBeInTheDocument()
    expect(screen.getAllByLabelText('拖动排序')).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: '完成排序' }))

    expect(screen.getByRole('button', { name: '调整顺序' })).toBeInTheDocument()
    expect(screen.queryByLabelText('拖动排序')).not.toBeInTheDocument()
  })
})
