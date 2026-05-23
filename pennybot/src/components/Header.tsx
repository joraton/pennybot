import { BotMark } from './BotMark'
import type { Screen } from '../lib/types'

interface Props {
  screen: Screen
  onBack: () => void
  onSettings: () => void
  onNewChat?: () => void
}

export function Header({ screen, onBack, onSettings, onNewChat }: Props) {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="bot-mark"><img src="/icons/icon128.png" alt="Pennybot" style={{ width: 30, height: 30, borderRadius: '50%', display: 'block' }} /></div>
        <span className="brand-name">Pennybot</span>
      </div>

      {screen === 'client' ? (
        <div className="header-actions">
          <span className="badge-online">EN LIGNE</span>
          <button className="btn-icon" onClick={onSettings} title="Paramètres">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
            </svg>
          </button>
        </div>
      ) : (
        <div className="header-actions">
          <button className="btn-icon" onClick={onBack} title="Changer de client">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <button className="btn-icon" title="Conversations">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>
            </svg>
          </button>
          <button className="btn-icon" title="Nouvelle conversation" onClick={onNewChat}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>
              <path d="M18.5 2.5a2.1 2.1 0 1 1 3 3L13 14l-4 1 1-4z"/>
            </svg>
          </button>
        </div>
      )}
    </header>
  )
}
