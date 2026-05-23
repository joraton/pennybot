import { useEffect, useRef, useState, useCallback } from 'react'
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
  onStop: () => void
  onSuggestionClick: (text: string) => void
}

interface AttachedFile {
  name: string
  content: string
  kind: 'text' | 'image'
}

const TEXT_TYPES = ['text/', 'application/json', 'application/csv', 'application/xml', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024

function readFile(file: File): Promise<AttachedFile> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_SIZE) { reject(new Error('Fichier trop volumineux (max 5 Mo)')); return }
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      reject(new Error('PDF non supporté — copiez-collez le texte directement.')); return
    }
    const isImage = file.type.startsWith('image/')
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result as string
      resolve({ name: file.name, content: result, kind: isImage ? 'image' : 'text' })
    }
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    if (isImage) reader.readAsDataURL(file)
    else reader.readAsText(file)
  })
}

function buildMessageWithFiles(text: string, files: AttachedFile[]): string {
  if (!files.length) return text
  const parts = files.map(f => {
    if (f.kind === 'image') return `__IMG__${f.content}__IMGNAME__${f.name}__ENDIMG__`
    return `[Fichier joint : ${f.name}]\n\`\`\`\n${f.content.slice(0, 8000)}\n\`\`\``
  })
  return parts.join('\n\n') + (text ? '\n\n' + text : '')
}

export function ChatView({ client, messages, suggestions, isTyping, onSend, onStop, onSuggestionClick }: Props) {
  const [input, setInput] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [attachError, setAttachError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, suggestions])

  function handleSend() {
    const text = input.trim()
    if (!text && !attachedFiles.length) return
    onSend(buildMessageWithFiles(text, attachedFiles))
    setInput('')
    setAttachedFiles([])
    setAttachError('')
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setAttachError('')
    try {
      const read = await Promise.all(files.map(readFile))
      setAttachedFiles(prev => [...prev, ...read].slice(0, 5))
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : 'Erreur')
    }
    e.target.value = ''
  }

  function removeFile(name: string) {
    setAttachedFiles(prev => prev.filter(f => f.name !== name))
  }

  const canSend = (input.trim().length > 0 || attachedFiles.length > 0) && !isTyping

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
            <div className="msg-bot-avatar"><img src="/icons/icon128.png" alt="Pennybot" /></div>
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

        {attachedFiles.length > 0 && (
          <div className="attach-chips">
            {attachedFiles.map(f => (
              <div key={f.name} className="attach-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                  {f.kind === 'image'
                    ? <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>
                    : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>
                  }
                </svg>
                <span className="attach-chip-name">{f.name}</span>
                <button className="attach-chip-remove" onClick={() => removeFile(f.name)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {attachError && <p className="attach-error">{attachError}</p>}

        <div className="input-bar">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.csv,.json,.md,.pdf,.js,.ts,.py,.xml,.xlsx,.docx,image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <svg className={`sparkle-icon${isTyping ? ' sparkle-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="#00f872" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <button className="btn-attach" title="Joindre un fichier" onClick={() => fileInputRef.current?.click()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21 11-9 9a5 5 0 0 1-7-7l9-9a4 4 0 0 1 6 6l-9 9a2 2 0 0 1-3-3l8-8"/>
            </svg>
          </button>
          {isTyping ? (
            <button className="btn-send btn-stop" onClick={onStop} title="Arrêter">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            </button>
          ) : (
            <button className="btn-send" disabled={!canSend} onClick={handleSend}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </button>
          )}
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
      <BotBubble html={message.html} />
    </div>
  )
}

function BotBubble({ html }: { html: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    navigator.clipboard.writeText(tmp.innerText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [html])

  return (
    <div className="bot-bubble-wrap">
      <div className="msg-bot-bubble" dangerouslySetInnerHTML={{ __html: html }} />
      <button className={`btn-copy${copied ? ' copied' : ''}`} onClick={handleCopy} title="Copier">
        {copied ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
      </button>
    </div>
  )
}
