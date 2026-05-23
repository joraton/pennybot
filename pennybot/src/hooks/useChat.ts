import { useState, useCallback, useRef } from 'react'
import type { Message, Client } from '../lib/types'
import { getMockResponse, getSuggestions } from '../lib/mockResponses'
import { callHermes, markdownToHtml } from '../lib/hermes'
import type { ConvMessage } from '../lib/hermes'

function uid() { return Math.random().toString(36).slice(2) }

function escHtml(str: string) {
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

  const resetForClient = useCallback((c: Client) => {
    setMessages([{ id: uid(), role: 'bot', html: buildWelcomeHtml(c) }])
    setSuggestions([])
    historyRef.current = []
  }, [])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMsg: Message = { id: uid(), role: 'user', html: escHtml(text) }
    setMessages(prev => [...prev, userMsg])
    setSuggestions([])
    setIsTyping(true)

    historyRef.current = [...historyRef.current, { role: 'user', content: text }]

    try {
      const apiKey = await getHermesKey()

      if (apiKey && client) {
        const responseText = await callHermes(historyRef.current, client, apiKey)
        historyRef.current = [...historyRef.current, { role: 'assistant', content: responseText }]
        setMessages(prev => [...prev, { id: uid(), role: 'bot', html: markdownToHtml(responseText) }])
        setSuggestions([])
      } else {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 700))
        const botHtml = getMockResponse(text, client)
        setMessages(prev => [...prev, { id: uid(), role: 'bot', html: botHtml }])
        setSuggestions(getSuggestions(text))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      historyRef.current = historyRef.current.slice(0, -1)
      setMessages(prev => [...prev, { id: uid(), role: 'bot', html: errorHtml(msg) }])
    } finally {
      setIsTyping(false)
    }
  }, [client, isTyping])

  return { messages, suggestions, isTyping, send, resetForClient }
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
