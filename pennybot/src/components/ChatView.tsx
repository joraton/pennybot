import { useEffect, useRef, useState } from 'react'
import { BotMark } from './BotMark'
import type { Client, Message } from '../lib/types'
import { avatarClass } from '../lib/data'
import { isWelcomeMessage } from '../hooks/useChat'

interface Props {
  client: Client
  messages: Message[]
  suggestions: string[]
  isTyping: boolean
  onSend: (text: string) => void
  onSuggestionClick: (text: string) => void
}

export function ChatView({ client, messages, suggestions, isTyping, onSend, onSuggestionClick }: Props) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, suggestions])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    onSend(text)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || !e.shiftKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px'
  }

  const canSend = input.trim().length > 0 && !isTyping

  return (
    <div id="screen-chat" className="screen">
      {/* Client sub-header */}
      <div className="chat-client-bar">
        <div className={`chat-client-avatar ${avatarClass(client.tone)}`}>{client.initial}</div>
        <div className="chat-client-info">
          <div className="chat-client-name">{client.name}{client.suffix ? ` ${client.suffix}` : ''}</div>
          <div className="chat-client-sub">
            <span className="status-dot-green" />
            <span>agent actif</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} client={client} onAction={onSend} />
        ))}

        {isTyping && (
          <div className="message bot">
            <div className="msg-bot-avatar"><BotMark size={26} /></div>
            <div className="msg-bot-bubble">
              <div className="typing-indicator">
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        {suggestions.length > 0 && !isTyping && (
          <div className="suggestions">
            {suggestions.map(s => (
              <button key={s} className="chip-suggest" onClick={() => onSuggestionClick(s)}>{s}</button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="composer">
        <div className="agent-rail">
          <span className="rail-dot" />
          <span className="rail-text">AGENT PRÊT · 4 sources connectées</span>
        </div>
        <div className="input-bar">
          <svg className="sparkle-icon" viewBox="0 0 24 24" fill="none" stroke="#00f872" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>
            <path d="m5.6 5.6 4.2 4.2M14.2 14.2l4.2 4.2M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2"/>
          </svg>
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="Demandez à Pennybot…"
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
          />
          <button className="btn-attach" title="Joindre un fichier">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21 11-9 9a5 5 0 0 1-7-7l9-9a4 4 0 0 1 6 6l-9 9a2 2 0 0 1-3-3l8-8"/>
            </svg>
          </button>
          <button className="btn-send" disabled={!canSend} onClick={handleSend}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
        </div>
        <div className="composer-footer">
          <div className="composer-hints">
            <kbd className="kbd-small">⌘K</kbd>
            <kbd className="kbd-small">⌘↵ envoyer</kbd>
          </div>
          <span className="composer-disclaimer">Pennybot peut se tromper</span>
        </div>
      </div>
    </div>
  )
}

const QUICK_ACTIONS = [
  { label: 'CA & encaissements', msg: 'Montre-moi le CA encaissé ce mois-ci', icon: 'M3 3v18h18M7 14l4-4 4 4 5-6' },
  { label: 'Factures à relancer', msg: 'Y a-t-il des factures à relancer ?', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5' },
  { label: 'Rapprochement',       msg: 'Quel est l\'état du rapprochement bancaire ?', icon: 'm3 9 9-5 9 5 M3 9h18v2H3z M5 11v8 M19 11v8 M9 11v8 M15 11v8 M3 19h18' },
  { label: 'Notes de frais',      msg: 'Il y a des notes de frais à classer ?', icon: 'M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2l-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2z M8 10h8 M8 14h6' },
]

function MessageBubble({ message, client, onAction }: { message: Message; client: Client; onAction: (t: string) => void }) {
  if (isWelcomeMessage(message.html)) {
    return (
      <div className="message bot">
        <div className="msg-bot-avatar"><BotMark size={26} /></div>
        <div className="msg-bot-bubble">
          <div className="welcome-eyebrow">Dossier ouvert · {client.name}</div>
          <div className="welcome-text">
            Bonjour&nbsp;! Je suis connecté au dossier de <strong>{client.name}</strong>.
            Que souhaitez-vous analyser&nbsp;?
          </div>
          <div className="action-grid">
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} className="action-btn" onClick={() => onAction(a.msg)}>
                <span className="action-btn-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d={a.icon} />
                  </svg>
                </span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (message.role === 'user') {
    return (
      <div className="message user">
        <div className={`msg-user-avatar ${avatarClass(client.tone)}`}>{client.initial}</div>
        <div className="msg-user-bubble" dangerouslySetInnerHTML={{ __html: message.html }} />
      </div>
    )
  }

  return (
    <div className="message bot">
      <div className="msg-bot-avatar"><BotMark size={26} /></div>
      <div className="msg-bot-bubble" dangerouslySetInnerHTML={{ __html: message.html }} />
    </div>
  )
}
