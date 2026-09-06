import { describe, expect, it } from 'vitest'
import {
  applicationStatusLabels,
  applicationStatusOptions,
  normalizeApplicationStatus
} from './constants'

describe('application status configuration', () => {
  it('removes screen passed and adds waiting for admission result', () => {
    expect(applicationStatusOptions).not.toContainEqual(expect.objectContaining({ value: 'SCREEN_PASSED' }))
    expect(applicationStatusOptions).toContainEqual({ value: 'WAITING_RESULT', label: '等待录取结果' })
    expect(Object.values(applicationStatusLabels)).not.toContain('初审通过')
  })

  it('maps the removed legacy status to shortlisted', () => {
    expect(normalizeApplicationStatus('SCREEN_PASSED')).toBe('SHORTLISTED')
  })
})
