import { describe, expect, it } from 'vitest'
import {
  buildChatCompletionsEndpoint,
  buildAdvisorInsightMessages,
  buildEmailDraftMessages,
  detectSourceType,
  extractJsonObjectFromAiText,
  extractReadableTextFromHtml
} from './aiOutreach'

describe('aiOutreach utilities', () => {
  it('builds OpenAI-compatible chat completions endpoints from common base URLs', () => {
    expect(buildChatCompletionsEndpoint('https://api.example.com')).toBe('https://api.example.com/v1/chat/completions')
    expect(buildChatCompletionsEndpoint('https://api.example.com/v1')).toBe('https://api.example.com/v1/chat/completions')
    expect(buildChatCompletionsEndpoint('https://api.example.com/v1/')).toBe('https://api.example.com/v1/chat/completions')
    expect(buildChatCompletionsEndpoint('https://api.example.com/v1/chat/completions')).toBe('https://api.example.com/v1/chat/completions')
  })

  it('extracts readable content from HTML while removing scripts, styles, and tags', () => {
    const html = `
      <html>
        <head><style>.hidden{display:none}</style><script>window.x = 1</script></head>
        <body>
          <h1>张教授</h1>
          <p>研究方向：人工智能 &amp; 计算机视觉。</p>
          <div>代表论文：Efficient Vision Transformer</div>
        </body>
      </html>
    `

    const text = extractReadableTextFromHtml(html)

    expect(text).toContain('张教授')
    expect(text).toContain('研究方向：人工智能 & 计算机视觉。')
    expect(text).toContain('代表论文：Efficient Vision Transformer')
    expect(text).not.toContain('window.x')
    expect(text).not.toContain('.hidden')
  })

  it('detects source type from URL and content type', () => {
    expect(detectSourceType('https://arxiv.org/abs/2401.00001', 'text/html')).toBe('ARXIV')
    expect(detectSourceType('https://example.edu/paper.pdf', 'application/pdf')).toBe('PDF')
    expect(detectSourceType('https://dblp.org/pid/00/0000.html', 'text/html')).toBe('DBLP')
    expect(detectSourceType('https://www.semanticscholar.org/author/123', 'text/html')).toBe('SEMANTIC_SCHOLAR')
    expect(detectSourceType('https://teacher.example.edu/home', 'text/html')).toBe('WEB')
  })

  it('builds advisor insight messages with source evidence and JSON output requirement', () => {
    const messages = buildAdvisorInsightMessages({
      advisor: { name: '张教授', title: '教授', researchArea: '计算机视觉', notes: '实验室偏工程落地' },
      institution: { name: '北京大学', department: '计算机学院' },
      systemPrompt: '你必须适配保研套磁任务，避免过度营销。',
      sources: [
        { url: 'https://example.edu/zhang', sourceType: 'WEB', title: '个人主页', text: '研究方向包括视觉表示学习和多模态理解。' }
      ]
    })

    const joined = messages.map((message) => message.content).join('\n')
    expect(joined).toContain('张教授')
    expect(joined).toContain('北京大学')
    expect(joined).toContain('视觉表示学习')
    expect(joined).toContain('JSON')
    expect(joined).toContain('emailHooks')
    expect(messages[0].content).toContain('避免过度营销')
  })

  it('builds email draft messages around a pasted source email and advisor insight', () => {
    const messages = buildEmailDraftMessages({
      advisor: { name: '张教授', title: '教授', researchArea: '计算机视觉', email: 'zhang@example.edu' },
      institution: { name: '北京大学', department: '计算机学院' },
      sourceEmail: '尊敬的老师：\n我是李同学，做过视觉检测项目，获得过校级一等奖。\n希望能加入您的课题组。',
      systemPrompt: '邮件必须具体、克制，并标出事实依据。',
      insight: { researchSummary: '导师关注视觉表示学习', fitAngles: '学生项目与视觉检测相关', emailHooks: '可引用其多模态方向' }
    })

    const joined = messages.map((message) => message.content).join('\n')
    expect(joined).toContain('李同学')
    expect(joined).toContain('视觉检测项目')
    expect(joined).toContain('校级一等奖')
    expect(joined).toContain('导师关注视觉表示学习')
    expect(joined).toContain('原始套磁信')
    expect(joined).toContain('subject')
    expect(joined).toContain('content')
    expect(joined).not.toContain('邮件模板')
    expect(joined).not.toContain('我的背景')
    expect(messages[0].content).toContain('标出事实依据')
  })

  it('extracts JSON objects from plain text or fenced AI responses', () => {
    expect(extractJsonObjectFromAiText('{"subject":"你好","content":"正文"}')).toEqual({ subject: '你好', content: '正文' })
    expect(extractJsonObjectFromAiText('```json\n{"ok":true}\n```')).toEqual({ ok: true })
    expect(extractJsonObjectFromAiText('结果如下：\n{"researchSummary":"方向"}\n请确认')).toEqual({ researchSummary: '方向' })
  })
})
