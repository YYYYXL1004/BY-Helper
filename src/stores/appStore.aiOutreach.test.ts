import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from './appStore'

const mockApi = {
  institution: {
    getAll: vi.fn()
  },
  aiConfig: {
    get: vi.fn(),
    save: vi.fn(),
    test: vi.fn()
  },
  personalProfile: {
    get: vi.fn(),
    save: vi.fn()
  },
  advisorSource: {
    addUrl: vi.fn()
  },
  advisorInsight: {
    generate: vi.fn()
  },
  emailDraft: {
    generate: vi.fn(),
    markSent: vi.fn()
  }
}

// @ts-expect-error - partial API mock for store tests
window.api = mockApi

beforeEach(() => {
  vi.clearAllMocks()
  useStore.setState({
    institutions: [],
    isLoading: false,
    error: null,
    aiConfig: null,
    personalProfile: null
  })
})

describe('appStore AI outreach actions', () => {
  it('loadAiConfig stores sanitized config from API', async () => {
    const config = { baseUrl: 'https://relay.example.com/v1', model: 'gpt-test', apiKeyPreview: 'sk-1...abcd' }
    mockApi.aiConfig.get.mockResolvedValueOnce({ success: true, data: config })

    await useStore.getState().loadAiConfig()

    expect(useStore.getState().aiConfig).toEqual(config)
  })

  it('savePersonalProfile stores profile on success', async () => {
    const profile = { name: '李同学', university: '某大学', major: '软件工程' }
    mockApi.personalProfile.save.mockResolvedValueOnce({ success: true, data: profile })

    await useStore.getState().savePersonalProfile(profile)

    expect(useStore.getState().personalProfile).toEqual(profile)
  })

  it('addAdvisorSource reloads institutions after URL ingestion', async () => {
    mockApi.advisorSource.addUrl.mockResolvedValueOnce({ success: true, data: { id: 's1' } })
    mockApi.institution.getAll.mockResolvedValueOnce([{ id: 'i1', advisors: [{ id: 'a1', sources: [{ id: 's1' }] }] }])

    await useStore.getState().addAdvisorSource('a1', 'https://example.edu/prof')

    expect(mockApi.advisorSource.addUrl).toHaveBeenCalledWith('a1', 'https://example.edu/prof')
    expect(useStore.getState().institutions).toEqual([{ id: 'i1', advisors: [{ id: 'a1', sources: [{ id: 's1' }] }] }])
  })

  it('generateEmailDraft returns draft and refreshes institutions', async () => {
    const draft = { id: 'd1', subject: '保研自荐', content: '正文' }
    mockApi.emailDraft.generate.mockResolvedValueOnce({ success: true, data: draft })
    mockApi.institution.getAll.mockResolvedValueOnce([])

    const result = await useStore.getState().generateEmailDraft({ advisorId: 'a1', sourceEmail: '原信正文' })

    expect(result).toEqual(draft)
    expect(mockApi.emailDraft.generate).toHaveBeenCalledWith({ advisorId: 'a1', sourceEmail: '原信正文' })
  })
})
