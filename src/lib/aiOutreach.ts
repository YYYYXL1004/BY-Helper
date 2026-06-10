export type OutreachSourceType = 'WEB' | 'PDF' | 'ARXIV' | 'DBLP' | 'SEMANTIC_SCHOLAR'

export const DEFAULT_AI_OUTREACH_SYSTEM_PROMPT = [
  '你是 PG-Tracker 的保研套磁助手，服务对象是准备中国高校保研/推免申请的学生。',
  '你的任务不是写泛泛的营销邮件，而是基于导师公开资料和用户粘贴的原始套磁信，生成具体、克制、可信、可人工编辑的套磁内容。',
  '必须遵守：不编造导师论文、招生名额、学生成果；不夸大经历；所有个性化切入点都要能追溯到用户提供的 URL、导师画像或原始套磁信。',
  '输出应适合发给高校导师：礼貌、简洁、专业，避免油腻话术、过度吹捧和空泛表达。',
  '如果资料不足，要明确指出缺口，并给出需要补充的信息。'
].join('\n')

export interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

export interface AdvisorPromptData {
  name: string
  title?: string | null
  researchArea?: string | null
  email?: string | null
  notes?: string | null
}

export interface InstitutionPromptData {
  name: string
  department?: string | null
}

export interface AdvisorSourcePromptData {
  url: string
  sourceType: OutreachSourceType
  title?: string | null
  text: string
}

export interface AdvisorInsightPromptData {
  researchSummary?: string | null
  fitAngles?: string | null
  emailHooks?: string | null
}

export function buildChatCompletionsEndpoint(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '')
  if (normalized.endsWith('/chat/completions')) return normalized
  if (normalized.endsWith('/v1')) return `${normalized}/chat/completions`
  return `${normalized}/v1/chat/completions`
}

export function extractReadableTextFromHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<\/(p|div|section|article|header|footer|li|tr|h[1-6])>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\r/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function detectSourceType(url: string, contentType?: string | null): OutreachSourceType {
  const lowerUrl = url.toLowerCase()
  const lowerContentType = (contentType || '').toLowerCase()
  if (lowerContentType.includes('pdf') || lowerUrl.endsWith('.pdf')) return 'PDF'
  if (lowerUrl.includes('arxiv.org/')) return 'ARXIV'
  if (lowerUrl.includes('dblp.org/')) return 'DBLP'
  if (lowerUrl.includes('semanticscholar.org/')) return 'SEMANTIC_SCHOLAR'
  return 'WEB'
}

export function buildAdvisorInsightMessages(input: {
  advisor: AdvisorPromptData
  institution: InstitutionPromptData
  systemPrompt?: string | null
  sources: AdvisorSourcePromptData[]
}): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        input.systemPrompt?.trim() || DEFAULT_AI_OUTREACH_SYSTEM_PROMPT,
        '你是保研套磁助手，负责根据导师公开资料生成可核验的导师画像。',
        '只使用用户提供的资料，不要编造论文、方向或招生信息。',
        '输出严格 JSON，不要 Markdown。字段：researchSummary, recentKeywords, representativeWorks, fitAngles, emailHooks, cautions。',
        'emailHooks 必须是可以写入套磁信的具体切入点。'
      ].join('\n')
    },
    {
      role: 'user',
      content: [
        '导师信息：',
        JSON.stringify(input.advisor, null, 2),
        '院校信息：',
        JSON.stringify(input.institution, null, 2),
        '资料来源：',
        JSON.stringify(
          input.sources.map((source) => ({
            url: source.url,
            sourceType: source.sourceType,
            title: source.title || '',
            text: truncateForPrompt(source.text, 6000)
          })),
          null,
          2
        ),
        '请基于以上资料输出 JSON。'
      ].join('\n')
    }
  ]
}

export function buildEmailDraftMessages(input: {
  advisor: AdvisorPromptData
  institution: InstitutionPromptData
  sourceEmail: string
  systemPrompt?: string | null
  insight: AdvisorInsightPromptData
}): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        input.systemPrompt?.trim() || DEFAULT_AI_OUTREACH_SYSTEM_PROMPT,
        '你是保研套磁邮件写作助手。',
        '目标是基于用户粘贴的原始套磁信，结合目标导师信息和导师画像，重写一封自然、克制、具体的中文套磁邮件。',
        '原始套磁信是用户真实背景和写作基线。必须保留其中真实的学生经历、成果和语气倾向，不要新增无法从原信或导师资料核验的事实。',
        '不要夸大经历，不要虚构导师论文，不要承诺不存在的成果，不要声称导师正在招生或有名额。',
        '输出严格 JSON，不要 Markdown。字段：subject, content, rationale, checklist。'
      ].join('\n')
    },
    {
      role: 'user',
      content: [
        '导师信息：',
        JSON.stringify(input.advisor, null, 2),
        '院校信息：',
        JSON.stringify(input.institution, null, 2),
        '导师画像：',
        JSON.stringify(input.insight, null, 2),
        '原始套磁信：',
        input.sourceEmail,
        '请保留原始套磁信中的真实背景与基本语气，结合导师画像改写出更适配该导师的新套磁信。重点增强个性化切入点，输出 JSON。'
      ].join('\n')
    }
  ]
}

export function truncateForPrompt(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}\n...[已截断 ${value.length - maxLength} 字符]`
}

export function extractJsonObjectFromAiText(text: string): unknown {
  const trimmed = text.trim()
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  const candidate = fencedMatch ? fencedMatch[1].trim() : extractJsonSlice(trimmed)
  return JSON.parse(candidate)
}

function extractJsonSlice(text: string): string {
  if (text.startsWith('{') && text.endsWith('}')) return text

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1)
  }
  return text
}

function decodeHtmlEntities(value: string): string {
  const entities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' '
  }

  return value.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (match, entity: string) => {
    const key = entity.toLowerCase()
    if (key.startsWith('#x')) {
      const codePoint = Number.parseInt(key.slice(2), 16)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match
    }
    if (key.startsWith('#')) {
      const codePoint = Number.parseInt(key.slice(1), 10)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match
    }
    return entities[key] || match
  })
}
