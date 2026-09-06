import React from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdvisorForm from './AdvisorForm'
import { useStore, type Advisor, type Institution } from '../../stores/appStore'

vi.mock('../ui/select', async () => {
  const ReactModule = await import('react')

  function collectOptions(children: React.ReactNode): React.ReactNode[] {
    const options: React.ReactNode[] = []
    ReactModule.Children.forEach(children, (child) => {
      if (!ReactModule.isValidElement(child)) return
      const element = child as React.ReactElement<{ value?: string; children?: React.ReactNode }>
      if (child.type === SelectItem) {
        options.push(<option key={String(element.props.value)} value={element.props.value}>{element.props.children}</option>)
        return
      }
      options.push(...collectOptions(element.props.children))
    })
    return options
  }

  function findTriggerId(children: React.ReactNode): string | undefined {
    let id: string | undefined
    ReactModule.Children.forEach(children, (child) => {
      if (id || !ReactModule.isValidElement(child)) return
      const element = child as React.ReactElement<{ id?: string; children?: React.ReactNode }>
      if (child.type === SelectTrigger) id = element.props.id
      else id = findTriggerId(element.props.children)
    })
    return id
  }

  const SelectItem = ({ children }: { children: React.ReactNode; value: string }): JSX.Element => <>{children}</>
  const SelectTrigger = ({ children }: { id?: string; children: React.ReactNode }): JSX.Element => <>{children}</>

  return {
    Select: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) => (
      <select id={findTriggerId(children)} value={value} onChange={(event) => onValueChange(event.target.value)}>
        {collectOptions(children)}
      </select>
    ),
    SelectTrigger,
    SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectItem,
    SelectValue: () => null
  }
})

const institutions: Institution[] = [
  {
    id: 'inst-1', name: '甲大学', department: '计算机学院', tier: 'REACH', degreeType: 'MASTER',
    campDeadline: null, pushDeadline: null, expectedQuota: null, policyTags: '[]',
    createdAt: '2026-01-01', updatedAt: '2026-01-01'
  },
  {
    id: 'inst-2', name: '乙大学', department: '人工智能学院', tier: 'MATCH', degreeType: 'MASTER',
    campDeadline: null, pushDeadline: null, expectedQuota: null, policyTags: '[]',
    createdAt: '2026-01-01', updatedAt: '2026-01-01'
  }
]

const advisor: Advisor = {
  id: 'advisor-1', institutionId: 'inst-1', name: '张教授', title: '教授', researchArea: '机器学习',
  email: 'zhang@example.com', homepage: null, contactStatus: 'PENDING', lastContactDate: null,
  reputationScore: null, notes: null
}

describe('AdvisorForm institution selection', () => {
  beforeEach(() => {
    useStore.setState({ institutions })
  })

  it('submits the newly selected institution when editing an advisor', async () => {
    const updateAdvisor = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    useStore.setState({ updateAdvisor })

    render(<AdvisorForm institutionId="inst-1" advisor={advisor} onClose={onClose} />)

    fireEvent.change(screen.getByLabelText('所属院校 *'), { target: { value: 'inst-2' } })
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))

    await waitFor(() => {
      expect(updateAdvisor).toHaveBeenCalledWith('advisor-1', expect.objectContaining({ institutionId: 'inst-2' }))
    })
    expect(onClose).toHaveBeenCalled()
  })
})
