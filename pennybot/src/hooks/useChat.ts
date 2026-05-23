import { useState, useCallback, useRef } from 'react'
import type { Message, Client } from '../lib/types'
import { getMockResponse, getSuggestions } from '../lib/mockResponses'
import { callHermes, markdownToHtml } from '../lib/hermes'
import type { ConvMessage } from '../lib/hermes'

function uid() { return Math.random().toString(36).slice(2) }

const IMG_MARKER = /__IMG__(data:image\/[^_]+)__IMGNAME__([^_]+)__ENDIMG__/g

function buildUserHtml(text: string): string {
  const parts: string[] = []
  let last = 0
  let match: RegExpExecArray | null
  IMG_MARKER.lastIndex = 0
  while ((match = IMG_MARKER.exec(text)) !== null) {
    const before = text.slice(last, match.index).trim()
    if (before) parts.push(`<span>${escText(before)}</span>`)
    parts.push(`<img class="msg-img-preview" src="${match[1]}" alt="${escText(match[2])}" />`)
    last = match.index + match[0].length
  }
  const after = text.slice(last).trim()
  if (after) parts.push(`<span>${escText(after)}</span>`)
  return parts.join('')
}

function escText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

function errorHtml(msg: string) {
  return `<div style="font-size:13px;color:#c0392b;line-height:1.5">
    <strong>Hermès indisponible</strong><br>${escHtml(msg)}
  </div>`
}

function getHermesKey(): Promise<string | null> {
  if (typeof chrome === 'undefined' || !chrome.storage) return Promise.resolve(null)
  return new Promise(resolve => {
    chrome.storage.local.get(['hermesKey'], data => {
      resolve((data?.hermesKey as string) || null)
    })
  })
}

export function useChat(client: Client | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const historyRef = useRef<ConvMessage[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const resetForClient = useCallback((c: Client) => {
    abortRef.current?.abort()
    setMessages([{ id: uid(), role: 'bot', html: buildWelcomeHtml(c) }])
    setSuggestions([])
    setIsTyping(false)
    historyRef.current = []
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMsg: Message = { id: uid(), role: 'user', html: buildUserHtml(text) }
    setMessages(prev => [...prev, userMsg])
    setSuggestions([])
    setIsTyping(true)

    historyRef.current = [...historyRef.current, { role: 'user', content: text }]

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const apiKey = await getHermesKey()

      if (apiKey && client) {
        const responseText = await callHermes(historyRef.current, client, apiKey, ctrl.signal)
        historyRef.current = [...historyRef.current, { role: 'assistant', content: responseText }]
        setMessages(prev => [...prev, { id: uid(), role: 'bot', html: markdownToHtml(responseText) }])
        setSuggestions([])
      } else {
        await new Promise((r, reject) => {
          const t = setTimeout(r, 1000 + Math.random() * 700)
          ctrl.signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Annulé', 'AbortError')) })
        })
        const botHtml = getMockResponse(text, client)
        setMessages(prev => [...prev, { id: uid(), role: 'bot', html: botHtml }])
        setSuggestions(getSuggestions(text))
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        historyRef.current = historyRef.current.slice(0, -1)
        setMessages(prev => [...prev, { id: uid(), role: 'bot', html: '<span style="color:#8fc8c8;font-size:12px">Génération arrêtée.</span>' }])
      } else {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue'
        historyRef.current = historyRef.current.slice(0, -1)
        setMessages(prev => [...prev, { id: uid(), role: 'bot', html: errorHtml(msg) }])
      }
    } finally {
      setIsTyping(false)
      abortRef.current = null
    }
  }, [client, isTyping])

  return { messages, suggestions, isTyping, send, stop, resetForClient }
}

function buildWelcomeHtml(c: Client) {
  return `__WELCOME__${c.id}`
}

export function isWelcomeMessage(html: string) {
  return html.startsWith('__WELCOME__')
}

export function getWelcomeClientId(html: string) {
  return html.replace('__WELCOME__', '')
}
