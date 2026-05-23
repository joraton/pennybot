import type { Client } from './types'

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export type ConvMessage = {
  role: 'user' | 'assistant'
  content: string | ContentPart[]
}

const HERMES_URL = 'http://localhost:8642/v1/chat/completions'

function clientContext(client: Client): string {
  return `Dossier client actif : ${client.name}${client.suffix ? ' ' + client.suffix : ''} — SIREN ${client.siren} — Secteur : ${client.sector ?? 'Non renseigné'} — Statut : ${client.sub}

Formate toujours tes réponses en markdown :
- **gras** pour les termes clés, noms, montants importants
- ## pour les titres de section
- - pour les listes à puces
- Paragraphes séparés par une ligne vide`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function applyInline(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

function isTitle(line: string): boolean {
  const t = line.trim()
  return t.length > 0 && t.length < 52 && !t.endsWith('.') && !/[,;:?!]$/.test(t) && !/^[-*•\d]/.test(t)
}

function preprocessMarkdown(md: string): string {
  return md
    // Fix double-dash: "- - item" → "- item"
    .replace(/^([ \t]*[-*•])[ \t]+[-*•][ \t]+/gm, '$1 ')
    // Convert "Title\n- item" pattern (title not starting with -) to "## Title\n- item"
    .replace(/^([^\n#\-*•\d>].{0,50}[^\n.,:;?!\s])\n([ \t]*[-*•])/gm, '## $1\n$2')
}

export function markdownToHtml(md: string): string {
  const cleaned = preprocessMarkdown(md)
  const blocks = cleaned.trim().split(/\n{2,}/)
  const html: string[] = []

  for (const block of blocks) {
    const lines = block.split('\n').filter(l => l.trim() !== '')
    if (!lines.length) continue
    const first = lines[0].trim()

    // Heading ## / ###
    if (/^#{1,3}\s/.test(first)) {
      const text = first.replace(/^#{1,3}\s+/, '')
      html.push(`<h3 class="md-h">${applyInline(escapeHtml(text))}</h3>`)
      const rest = lines.slice(1)
      if (rest.length) processLines(rest, html)
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(first)) {
      html.push('<hr class="md-hr">')
      continue
    }

    // "term\ndescription" — short label + one description line, no list markers
    if (lines.length === 2 && isTitle(first) && !/^[-*•\d]/.test(lines[1].trim())) {
      html.push(`<p class="md-p"><strong>${applyInline(escapeHtml(first))}</strong><br><span class="md-desc">${applyInline(escapeHtml(lines[1].trim()))}</span></p>`)
      continue
    }

    processLines(lines, html)
  }

  return `<div class="md-body">${html.join('')}</div>`
}

function processLines(lines: string[], html: string[]) {
  const listItems: string[] = []
  let listType = ''

  const flush = () => {
    if (!listItems.length) return
    html.push(`<${listType} class="md-${listType}">${listItems.join('')}</${listType}>`)
    listItems.length = 0
    listType = ''
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) continue

    if (/^[-*•]\s/.test(t)) {
      if (listType !== 'ul') { flush(); listType = 'ul' }
      const content = t.replace(/^[-*•]\s+/, '')
      listItems.push(`<li>${applyInline(escapeHtml(content))}</li>`)
    } else if (/^\d+\.\s/.test(t)) {
      if (listType !== 'ol') { flush(); listType = 'ol' }
      const content = t.replace(/^\d+\.\s+/, '')
      listItems.push(`<li>${applyInline(escapeHtml(content))}</li>`)
    } else {
      flush()
      html.push(`<p class="md-p">${applyInline(escapeHtml(t))}</p>`)
    }
  }
  flush()
}

const IMG_REGEX = /__IMG__(data:image\/[^;]+;base64,[^_]+)__IMGNAME__([^_]+)__ENDIMG__/g

function parseUserContent(text: string): string | ContentPart[] {
  const images: { data: string; name: string }[] = []
  const clean = text.replace(IMG_REGEX, (_, data, name) => {
    images.push({ data, name })
    return `[Image : ${name}]`
  })
  if (!images.length) return clean
  return [
    { type: 'text', text: clean.trim() },
    ...images.map(img => ({ type: 'image_url' as const, image_url: { url: img.data } })),
  ]
}

export async function callHermes(
  history: ConvMessage[],
  client: Client,
  apiKey: string,
  signal?: AbortSignal
): Promise<string> {
  // Parse images in last user message for multimodal support
  const messages = [
    { role: 'system', content: clientContext(client) },
    ...history.map((m, i) => {
      if (m.role === 'user' && i === history.length - 1 && typeof m.content === 'string') {
        return { role: m.role, content: parseUserContent(m.content) }
      }
      return m
    }),
  ]

  const response = await fetch(HERMES_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4',
      messages,
      stream: false,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ??
      `Hermès gateway inaccessible (${response.status}) — lance \`hermes gateway\` dans ton terminal`
    )
  }

  const data = await response.json() as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message?.content ?? ''
}
