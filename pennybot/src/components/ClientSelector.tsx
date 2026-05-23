import { useRef } from 'react'
import type { Client } from '../lib/types'
import { avatarClass, statusDotClass, greetingByHour } from '../lib/data'

interface Props {
  recent: Client[]
  others: Client[]
  query: string
  onQueryChange: (q: string) => void
  onSelect: (client: Client) => void
  onAddClient: () => void
}

export function ClientSelector({ recent, others, query, onQueryChange, onSelect, onAddClient }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const total = recent.length + others.length
  const noResults = total === 0 && query.trim() !== ''

  return (
    <div id="screen-client" className="screen">
      <div className="hero">
        <div className="eyebrow">{greetingByHour()}, Léa</div>
        <h1>Sur quel dossier<br /><span className="muted">travaillez-vous ce soir&nbsp;?</span></h1>
      </div>

      <div className="search-bar" onClick={() => inputRef.current?.focus()}>
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="#00f872" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><path d="m5.6 5.6 4.2 4.2M14.2 14.2l4.2 4.2M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Rechercher un client, une facture, un SIRET…"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          autoComplete="off"
        />
        <kbd className="kbd">⌘&nbsp;K</kbd>
      </div>

      <div className="client-sections">
        {noResults ? (
          <div className="empty-search">
            <div className="empty-search-text">Aucun client trouvé pour «&nbsp;{query}&nbsp;»</div>
          </div>
        ) : (
          <>
            {recent.length > 0 && (
              <div className="section">
                <div className="section-label">
                  <span>Récents</span>
                  <span>{recent.length} dossier{recent.length > 1 ? 's' : ''}</span>
                </div>
                <div className="client-list">
                  {recent.map((c, i) => (
                    <ClientRow key={c.id} client={c} isActive={i === 0 && !query} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            )}

            {others.length > 0 && (
              <div className="section">
                <div className="section-label">
                  <span>Tous mes clients</span>
                  <span>{recent.length + others.length} dossiers</span>
                </div>
                <div className="client-list">
                  {others.map(c => (
                    <ClientRowCompact key={c.id} client={c} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="client-footer">
        <button className="btn-add-client" onClick={onAddClient}>
          <span className="btn-add-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#00f872" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </span>
          Ajouter un client
        </button>
        <span className="footer-version">v 1.4 · Cabinet Renard</span>
      </footer>
    </div>
  )
}

function ClientRow({ client, isActive, onSelect }: { client: Client; isActive: boolean; onSelect: (c: Client) => void }) {
  return (
    <div className={`client-row${isActive ? ' active' : ''}`} onClick={() => onSelect(client)}>
      <div className={`client-avatar ${avatarClass(client.tone)}`}>{client.initial}</div>
      <div className="client-info">
        <div className="client-row-name">
          <span className="name">{client.name}</span>
          {client.suffix && <span className="suffix">{client.suffix}</span>}
        </div>
        <div className="client-row-sub">
          <span className={`status-dot ${statusDotClass(client.subTone)}`} />
          <span className="sub-text">{client.sub}</span>
        </div>
      </div>
      {isActive ? (
        <div className="badge-active">
          ACTIF
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </div>
      ) : (
        <span className="client-last-seen">{client.lastSeen}</span>
      )}
    </div>
  )
}

function ClientRowCompact({ client, onSelect }: { client: Client; onSelect: (c: Client) => void }) {
  return (
    <div className="client-row-compact" onClick={() => onSelect(client)}>
      <div className={`client-avatar-sm ${avatarClass(client.tone)}`}>{client.initial}</div>
      <div className="compact-info">
        <span className="compact-name">{client.name}</span>
        {client.suffix && <span className="compact-suffix">{client.suffix}</span>}
      </div>
      <span className={`status-dot ${statusDotClass(client.subTone)}`} />
      <span className="client-last-seen">{client.lastSeen}</span>
    </div>
  )
}
