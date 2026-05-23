import type { Client } from './types'

export type ConvMessage = { role: 'user' | 'assistant'; content: string }

const HERMES_URL = 'http://localhost:8642/v1/chat/completions'

function clientContext(client: Client): string {
  return `Dossier client actif : ${client.name}${client.suffix ? ' ' + client.suffix : ''} — SIREN ${client.siren} — Secteur : ${client.sector ?? 'Non renseigné'} — Statut : ${client.sub}`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function markdownToHtml(md: string): string {
  const escaped = escapeHtml(md)
  const lines = escaped.split('\n')
  const result: string[] = []
  let inList = false

  for (const line of lines) {
    const listMatch = line.match(/^[-•*]\s+(.+)/)
    if (listMatch) {
      if (!inList) { result.push('<ul style="margin:6px 0 6px 16px;padding:0">'); inList = true }
      result.push(`<li style="margin:2px 0">${applyInline(listMatch[1])}</li>`)
    } else {
      if (inList) { result.push('</ul>'); inList = false }
      if (line.trim() === '') {
        result.push('<br>')
      } else {
        result.push(`<span>${applyInline(line)}</span><br>`)
      }
    }
  }
  if (inList) result.push('</ul>')

  return `<div style="font-size:13px;color:#2a3a3a;line-height:1.6">${result.join('')}</div>`
}

function applyInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#003d3d">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f0f4f3;padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
}

export async function callHermes(
  history: ConvMessage[],
  client: Client,
  apiKey: string
): Promise<string> {
  const messages = [
    { role: 'system', content: clientContext(client) },
    ...history,
  ]

  const response = await fetch(HERMES_URL, {
    method: 'POST',
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
