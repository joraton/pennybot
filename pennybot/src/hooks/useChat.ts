import { useState, useCallback } from 'react'
import type { Message, Client } from '../lib/types'
import { getMockResponse, getSuggestions } from '../lib/mockResponses'

function uid() { return Math.random().toString(36).slice(2) }

export function useChat(client: Client | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const resetForClient = useCallback((c: Client) => {
    setMessages([{
      id: uid(),
      role: 'bot',
      html: buildWelcomeHtml(c),
    }])
    setSuggestions([])
  }, [])

  const send = useCallback((text: string) => {
    if (!text.trim() || isTyping) return
    const userMsg: Message = { id: uid(), role: 'user', html: escHtml(text) }
    setMessages(prev => [...prev, userMsg])
    setSuggestions([])
    setIsTyping(true)

    setTimeout(() => {
      const botHtml = getMockResponse(text, client)
      setMessages(prev => [...prev, { id: uid(), role: 'bot', html: botHtml }])
      setSuggestions(getSuggestions(text))
      setIsTyping(false)
    }, 1000 + Math.random() * 700)
  }, [client, isTyping])

  return { messages, suggestions, isTyping, send, resetForClient }
}

function escHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
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
